import { jest } from '@jest/globals';
export const createAccount = jest.fn().mockResolvedValue({
    publicKey: 'G_TEST_PUBLIC_KEY',
    secret: 'S_TEST_SECRET_KEY'
});
//# sourceMappingURL=account.stellar.js.map