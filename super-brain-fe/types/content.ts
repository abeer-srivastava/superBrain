export interface Content {
    id: string;
    title: string;
    link: string;
    type: string;
    userId?: string;
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
