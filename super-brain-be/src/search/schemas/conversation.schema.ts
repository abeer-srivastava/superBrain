import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class MessageSource {
  @Prop() n: number;
  @Prop() contentId: string;
  @Prop() title: string;
  @Prop() type: string;
  @Prop() url?: string;
  @Prop() siteName?: string;
}

@Schema({ _id: false, timestamps: { createdAt: true, updatedAt: false } })
export class Message {
  @Prop({ type: String, required: true, enum: ['user', 'assistant'] }) role: 'user' | 'assistant';
  @Prop({ required: true }) content: string;
  @Prop({ type: [SchemaFactory.createForClass(MessageSource)], default: [] }) sources: MessageSource[];
  createdAt?: Date;
}

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 120 }) title: string;

  @Prop({ type: [SchemaFactory.createForClass(Message)], default: [] })
  messages: Message[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ userId: 1, updatedAt: -1 });
