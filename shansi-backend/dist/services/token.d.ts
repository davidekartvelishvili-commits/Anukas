interface TokenPayload {
    userId: string;
    phone: string;
}
export declare function signToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): TokenPayload;
export {};
//# sourceMappingURL=token.d.ts.map