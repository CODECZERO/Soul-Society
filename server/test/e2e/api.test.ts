
import { jest, describe, it, expect, beforeAll } from '@jest/globals';

// 1. Define Mock Functions explicitly
const mockRegisterMission = jest.fn<any>();
const mockCreateAccount = jest.fn<any>();

// Mock Vault functions
const mockVaultPut = jest.fn<any>();
const mockVaultGet = jest.fn<any>();
const mockVaultGetAll = jest.fn<any>();
const mockVaultPutWithIndex = jest.fn<any>();
const mockVaultGetByIndex = jest.fn<any>();

// 2. Register Mocks using unstable_mockModule (Must be before imports)
jest.unstable_mockModule('../../src/services/stellar/smartContract.handler.stellar.js', () => ({
    registerMission: mockRegisterMission,
    sealMissionProof: jest.fn<any>(),
    saveContractWithWallet: jest.fn<any>(),
    getLatestData: jest.fn<any>(),
    server: {},
    STACK_ADMIN_SECRET: 'MOCK_SECRET', // Won't be used by Vault anymore
    __esModule: true,
}));

jest.unstable_mockModule('../../src/services/stellar/account.stellar.js', () => ({
    createAccount: mockCreateAccount,
    DeletAccount: jest.fn<any>(),
    __esModule: true,
}));

// Fully Mock Vault Service to avoid side-effects during instantiation
jest.unstable_mockModule('../../src/services/stellar/seireiteiVault.service.js', () => ({
    seireiteiVault: {
        put: mockVaultPut,
        get: mockVaultGet,
        getAll: mockVaultGetAll,
        putWithIndex: mockVaultPutWithIndex,
        getByIndex: mockVaultGetByIndex,
    },
    SeireiteiVaultService: class { },
    __esModule: true,
}));

// 3. Dynamic Imports (Top-Level Await)
// Note: In Jest ESM, we need to import system under test AFTER mocks
// @ts-ignore
const appModule = await import('../../src/app.js');
const app = appModule.default;
// @ts-ignore
const request = (await import('supertest')).default;
// @ts-ignore
const bcrypt = (await import('bcrypt')).default;

// 4. Configure Mock Returns
mockVaultPut.mockResolvedValue('MOCK_CID');
mockVaultGet.mockResolvedValue({});
mockVaultGetAll.mockResolvedValue([]);
mockVaultPutWithIndex.mockResolvedValue('MOCK_INDEXED_CID');
mockVaultGetByIndex.mockResolvedValue(null);

mockRegisterMission.mockResolvedValue({ hash: 'MOCK_TX_HASH' });
mockCreateAccount.mockResolvedValue({
    publicKey: 'G_TEST_PUBLIC_KEY',
    secret: 'S_TEST_SECRET_KEY'
});

describe('Soul Society API E2E (Blockchain Vault)', () => {
    const testUser = {
        ngoName: 'Test NGO Vault',
        regNumber: 'REG-VAULT-99',
        description: 'Vault Test Description',
        email: 'vault@test.com',
        phoneNo: '+1234567890',
        password: 'Password123!',
    };

    let authToken: string;
    let userId: string;
    let postId: string;

    it('GET /health - Should return 200 OK', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/user/signup - Should register using Vault & Stellar Account', async () => {
        // @ts-ignore
        mockVaultGetByIndex.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/user/signup')
            .send(testUser);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.userData.Email).toBe(testUser.email);
    });

    it('POST /api/user/login - Should login and return JWT', async () => {
        const hashedFn = await bcrypt.hash(testUser.password, 10);

        // @ts-ignore
        mockVaultGetByIndex.mockResolvedValueOnce({
            _id: 'USER_ID_123',
            Email: testUser.email,
            Password: hashedFn,
            NgoName: testUser.ngoName,
            PublicKey: 'G_TEST_PUBLIC_KEY',
            walletAddr: 'G_TEST_PUBLIC_KEY'
        });

        const res = await request(app)
            .post('/api/user/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeDefined();

        authToken = res.body.data.accessToken;
        userId = res.body.data.user.id;
    });

    it('POST /api/posts - Should create a post on Vault & Register on Chain', async () => {
        // Mock user lookup for middleware
        // @ts-ignore
        mockVaultGetByIndex.mockResolvedValue({
            _id: 'USER_ID_123',
            Email: testUser.email,
            NgoName: testUser.ngoName,
            PublicKey: 'G_TEST_PUBLIC_KEY',
            walletAddr: 'G_TEST_PUBLIC_KEY'
        });

        const postData = {
            Title: 'Vault Mission',
            Type: 'Emergency',
            Description: 'Testing Vault Storage',
            Location: 'Hueco Mundo',
            ImgCid: 'QmTestVault',
            NeedAmount: 1000,
            DangerLevel: 'High'
        };

        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send(postData);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.Title).toBe(postData.Title);

        postId = res.body.data._id;
    });

    it('GET /api/posts - Should retrieve posts from "Blockchain" (Vault Mock)', async () => {
        // @ts-ignore
        mockVaultGetAll.mockResolvedValueOnce([
            {
                _id: postId || 'POST_ID_123',
                Title: 'Vault Mission',
                NeedAmount: 1000,
                WalletAddr: 'G_TEST_PUBLIC_KEY',
                ImgCid: 'QmTestVault',
                CollectedAmount: 0
            }
        ]);

        const res = await request(app).get('/api/posts');

        expect(res.status).toBe(200);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data[0].Title).toBe('Vault Mission');
        expect(res.body.data[0]).toHaveProperty('CollectedAmount');
    });

    it('Advanced: Verify On-Chain Registration was Called', () => {
        expect(mockRegisterMission).toHaveBeenCalled();
    });
});
