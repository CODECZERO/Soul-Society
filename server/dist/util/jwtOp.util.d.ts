interface TokenPayload {
    email?: string;
    NgoName?: string;
    walletAddr?: string;
    id?: string;
}
declare const genAccessToken: (user: TokenPayload) => Promise<string>;
declare const genRefreshToken: (user: TokenPayload) => Promise<string>;
export { genAccessToken, genRefreshToken };
//# sourceMappingURL=jwtOp.util.d.ts.map