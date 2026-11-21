import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, Message } from './schemas/conversation.schema';
import { assertObjectId } from '../common/http/validation';

@Injectable()
export class ConversationService {
  constructor(@InjectModel(Conversation.name) private readonly model: Model<Conversation>) {}

  async list(userId: string, limit = 50) {
    const rows = await this.model
      .aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $sort: { updatedAt: -1 } },
        { $limit: limit },
        { $project: { title: 1, updatedAt: 1, createdAt: 1, messageCount: { $size: '$messages' } } },
      ])
      .exec();
    return rows;
  }

  async findOwned(id: string, userId: string) {
    assertObjectId(id);
    const doc = await this.model.findOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
    if (!doc) throw new NotFoundException('Conversation not found');
    return doc;
  }

  create(userId: string, title: string, messages: Message[]) {
    return this.model.create({ userId: new Types.ObjectId(userId), title, messages });
  }

  async append(id: string, userId: string, messages: Message[]) {
    await this.model.updateOne({ _id: id, userId: new Types.ObjectId(userId) }, { $push: { messages: { $each: messages } } }).exec();
  }

  async rename(id: string, userId: string, title: string) {
    const doc = await this.model
      .findOneAndUpdate({ _id: assertObjectId(id), userId: new Types.ObjectId(userId) }, { title }, { returnDocument: 'after' })
      .exec();
    if (!doc) throw new NotFoundException('Conversation not found');
    return doc;
  }

  async delete(id: string, userId: string) {
    const r = await this.model.deleteOne({ _id: assertObjectId(id), userId: new Types.ObjectId(userId) }).exec();
    if (r.deletedCount === 0) throw new NotFoundException('Conversation not found');
  }

  exportAll(userId: string) {
    return this.model.find({ userId: new Types.ObjectId(userId) }).select('-userId -__v').sort({ createdAt: 1 }).lean().exec();
  }

  async deleteAllForUser(userId: string) {
    await this.model.deleteMany({ userId: new Types.ObjectId(userId) }).exec();
  }
}
