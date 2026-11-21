import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { Link } from './schemas/link.schema';

@Injectable()
export class ShareService {
  constructor(@InjectModel(Link.name) private readonly linkModel: Model<Link>) {}

  private newHash() {
    // 128 bits — unguessable; URL-safe.
    return randomBytes(16).toString('base64url');
  }

  async status(userId: string) {
    const link = await this.linkModel.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
    return { enabled: !!link, hash: link?.hash ?? null };
  }

  async enable(userId: string) {
    const existing = await this.linkModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (existing) return { enabled: true, hash: existing.hash };
    const link = await this.linkModel.create({ userId: new Types.ObjectId(userId), hash: this.newHash() });
    return { enabled: true, hash: link.hash };
  }

  async disable(userId: string) {
    await this.linkModel.deleteMany({ userId: new Types.ObjectId(userId) }).exec();
    return { enabled: false, hash: null };
  }

  /** Invalidate the old public URL and issue a new one. */
  async rotate(userId: string) {
    await this.disable(userId);
    return this.enable(userId);
  }

  async userIdByHash(hash: string): Promise<string | null> {
    if (!/^[\w-]{10,64}$/.test(hash)) return null;
    const link = await this.linkModel.findOne({ hash }).lean().exec();
    return link ? link.userId.toString() : null;
  }
}
