import { Document, Types } from 'mongoose';
export type ContentDocument = Content & Document;
export declare class Content {
    userId: Types.ObjectId;
    type: string;
    originalLink?: string;
    title?: string;
    extractedText?: string;
    summary?: string;
    tags: string[];
    status: string;
}
export declare const ContentSchema: import("mongoose").Schema<Content, import("mongoose").Model<Content, any, any, any, (Document<unknown, any, Content, any, import("mongoose").DefaultSchemaOptions> & Content & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Content, any, import("mongoose").DefaultSchemaOptions> & Content & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Content>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Content, Document<unknown, {}, Content, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Content, Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, Content, Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    originalLink?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    extractedText?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    summary?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tags?: import("mongoose").SchemaDefinitionProperty<string[], Content, Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Content, Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Content>;
