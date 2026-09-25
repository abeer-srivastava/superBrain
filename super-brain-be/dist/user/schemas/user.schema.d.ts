import { Document } from 'mongoose';
export type UserDocument = User & Document;
export declare class User {
    email: string;
    username: string;
    passwordHash: string;
}
export declare const UserSchema: any;
