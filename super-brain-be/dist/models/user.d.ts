import mongoose from "mongoose";
declare const User: mongoose.Model<{
    username: string;
    password: string;
    email: string;
    salt?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    username: string;
    password: string;
    email: string;
    salt?: string | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    username: string;
    password: string;
    email: string;
    salt?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    username: string;
    password: string;
    email: string;
    salt?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    username: string;
    password: string;
    email: string;
    salt?: string | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    username: string;
    password: string;
    email: string;
    salt?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default User;
//# sourceMappingURL=user.d.ts.map