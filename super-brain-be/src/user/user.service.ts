import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  createdAt: Date | undefined;
}

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  create(data: { email: string; username: string; passwordHash: string }): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  findByUsername(username: string) {
    return this.userModel.findOne({ username }).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /** Includes the password hash — only for credential checks. */
  findByIdentifierWithSecret(identifier: string) {
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { username: identifier };
    return this.userModel.findOne(query).select('+passwordHash').exec();
  }

  findByIdWithSecret(id: string) {
    return this.userModel.findById(id).select('+passwordHash').exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updates: Partial<Pick<User, 'displayName' | 'passwordHash'>> & { $inc?: any }) {
    const { $inc, ...set } = updates;
    return this.userModel
      .findByIdAndUpdate(id, { $set: set, ...($inc ? { $inc } : {}) }, { returnDocument: 'after' })
      .exec();
  }

  async bumpTokenVersion(id: string) {
    return this.userModel.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } }, { returnDocument: 'after' }).exec();
  }

  async deleteById(id: string) {
    await this.userModel.deleteOne({ _id: id }).exec();
  }

  toPublic(user: UserDocument): PublicUser {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName ?? null,
      createdAt: user.createdAt,
    };
  }
}
