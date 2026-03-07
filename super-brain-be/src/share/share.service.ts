import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Link, LinkDocument } from './schemas/link.schema';
import * as crypto from 'crypto';

@Injectable()
export class ShareService {
  constructor(@InjectModel(Link.name) private linkModel: Model<LinkDocument>) {}

  async createShareLink(userId: string): Promise<string> {
    let link = await this.linkModel.findOne({ userId }).exec();
    if (link) {
      return link.hash;
    }

    const hash = crypto.randomBytes(10).toString('hex');
    link = new this.linkModel({ userId, hash });
    await link.save();
    return link.hash;
  }

  async disableShareLink(userId: string): Promise<void> {
    await this.linkModel.deleteOne({ userId }).exec();
  }

  async getUserIdByHash(hash: string): Promise<string | null> {
    const link = await this.linkModel.findOne({ hash }).exec();
    return link ? link.userId.toString() : null;
  }
}
