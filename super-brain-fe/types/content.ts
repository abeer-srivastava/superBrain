export interface Content {
    id: string;
    _id?: string; // MongoDB format
    title: string;
    link?: string;
    originalLink?: string;
    type: string;
    userId?: string;
    status: 'processing' | 'ready' | 'failed';
    extractedText?: string;
    summary?: string;
    tags?: string[];
    createdAt?: string;
}

export interface SearchResult {
    id: string;
    score: number;
    title: string;
    link: string;
    type: string;
}

export interface User {
    username: string;
    email: string;
    id?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ShareBrainResponse {
    hash?: string;
    message: string;
}

export interface SharedBrain {
    username: string;
    contents: Content[];
}
