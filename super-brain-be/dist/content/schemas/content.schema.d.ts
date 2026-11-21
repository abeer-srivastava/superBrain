import { HydratedDocument, Types } from 'mongoose';
export declare const CONTENT_TYPES: readonly ["link", "note", "pdf", "image"];
export type ContentType = (typeof CONTENT_TYPES)[number];
export declare const CONTENT_STATUSES: readonly ["processing", "ready", "failed"];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type ContentDocument = HydratedDocument<Content>;
export declare class Content {
    userId: Types.ObjectId;
    type: ContentType;
    originalLink?: string;
    title?: string;
    extractedText?: string;
    originalText?: string;
    summary?: string;
    keyPoints: string[];
    tags: string[];
    annotation?: string;
    siteName?: string;
    author?: string;
    imageUrl?: string;
    wordCount?: number;
    filePath?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    status: ContentStatus;
    error?: string;
    favorite: boolean;
    isPrivate: boolean;
    lastViewedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ContentSchema: import("mongoose").Schema<Content, import("mongoose").Model<Content, any, any, any, (import("mongoose").Document<unknown, any, Content, any, import("mongoose").DefaultSchemaOptions> & Content & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, Content, any, import("mongoose").DefaultSchemaOptions> & Content & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Content>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Content, import("mongoose").Document<unknown, {}, Content, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<"link" | "note" | "pdf" | "image", Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    originalLink?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    extractedText?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    originalText?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    summary?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    keyPoints?: import("mongoose").SchemaDefinitionProperty<string[], Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tags?: import("mongoose").SchemaDefinitionProperty<string[], Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    annotation?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    siteName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    author?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    imageUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    wordCount?: import("mongoose").SchemaDefinitionProperty<number | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    filePath?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fileName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mimeType?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fileSize?: import("mongoose").SchemaDefinitionProperty<number | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"processing" | "ready" | "failed", Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    error?: import("mongoose").SchemaDefinitionProperty<string | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    favorite?: import("mongoose").SchemaDefinitionProperty<boolean, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isPrivate?: import("mongoose").SchemaDefinitionProperty<boolean, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastViewedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Content>;
export declare const LIST_PROJECTION = "-extractedText -filePath";
