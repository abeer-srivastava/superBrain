import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from './schemas/content.schema';

@Injectable()
export class ContentService {
  constructor(@InjectModel(Content.name) private contentModel: Model<ContentDocument>) {}

  async create(createDto: any): Promise<ContentDocument> {
    const created = new this.contentModel(createDto);
    return created.save();
  }

  async findByUser(userId: string): Promise<ContentDocument[]> {
    return this.contentModel.find({ userId }).exec();
  }

  async findById(id: string): Promise<ContentDocument | null> {
    return this.contentModel.findById(id).exec();
  }

  async updateStatus(id: string, updates: Partial<Content>): Promise<ContentDocument | null> {
    return this.contentModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async delete(id: string, userId: string): Promise<any> {
    return this.contentModel.deleteOne({ _id: id, userId }).exec();
  }
}
