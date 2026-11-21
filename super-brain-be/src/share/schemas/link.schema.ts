import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LinkDocument = HydratedDocument<Link>;

@Schema({ timestamps: true })
export class Link {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  hash: string;
}

export const LinkSchema = SchemaFactory.createForClass(Link);
