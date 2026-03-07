import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContentDocument = Content & Document;

@Schema({ timestamps: true })
export class Content {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['link', 'note', 'pdf', 'image'] })
  type: string;

  @Prop()
  originalLink?: string;

  @Prop()
  title?: string;

  @Prop()
  extractedText?: string;

  @Prop()
  summary?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true, enum: ['processing', 'ready', 'failed'], default: 'processing' })
  status: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content);
