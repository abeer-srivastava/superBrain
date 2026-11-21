import { Document, Types } from 'mongoose';
export type LinkDocument = Link & Document;
export declare class Link {
    userId: Types.ObjectId;
    hash: string;
}
export declare const LinkSchema: import("mongoose").Schema<Link, import("mongoose").Model<Link, any, any, any, (Document<unknown, any, Link, any, import("mongoose").DefaultSchemaOptions> & Link & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Link, any, import("mongoose").DefaultSchemaOptions> & Link & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Link>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Link, Document<unknown, {}, Link, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Link & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Link, Document<unknown, {}, Link, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Link & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    hash?: import("mongoose").SchemaDefinitionProperty<string, Link, Document<unknown, {}, Link, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Link & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Link>;
