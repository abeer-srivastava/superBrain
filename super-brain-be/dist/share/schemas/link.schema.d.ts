import { HydratedDocument, Types } from 'mongoose';
export type LinkDocument = HydratedDocument<Link>;
export declare class Link {
    userId: Types.ObjectId;
    hash: string;
}
export declare const LinkSchema: import("mongoose").Schema<Link, import("mongoose").Model<Link, any, any, any, (import("mongoose").Document<unknown, any, Link, any, import("mongoose").DefaultSchemaOptions> & Link & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, Link, any, import("mongoose").DefaultSchemaOptions> & Link & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Link>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Link, import("mongoose").Document<unknown, {}, Link, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Link & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Link, import("mongoose").Document<unknown, {}, Link, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Link & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    hash?: import("mongoose").SchemaDefinitionProperty<string, Link, import("mongoose").Document<unknown, {}, Link, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Link & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Link>;
