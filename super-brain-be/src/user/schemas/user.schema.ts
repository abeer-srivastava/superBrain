import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  /** Optional display name shown on the public page. */
  @Prop({ trim: true, maxlength: 60 })
  displayName?: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  /**
   * Incremented to revoke every outstanding session (password change,
   * "sign out everywhere"). Embedded in each JWT as `tv`.
   */
  @Prop({ default: 0 })
  tokenVersion: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
