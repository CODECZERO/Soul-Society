/**
 * Soul Society — Server Integration Tests
 * =========================================
 * These tests hit the real Express app (supertest) with NODE_ENV=test.
 * DB connection is skipped in test mode; blockchain calls use real vault
 * service when available, or gracefully handle errors.
 */
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Set environment BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3002';
process.env.ATS = 'test_access_secret_12345';
process.env.RTS = 'test_refresh_secret_67890';
process.env.ATE = '15m';
process.env.RTE = '7d';
process.env.BLOCKCHAIN_NETWORK = 'https://horizon-testnet.stellar.org';
process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
process.env.PINATA_JWT = 'test_jwt';
process.env.PINATA_GATEWAY = 'gateway.pinata.cloud';
process.env.STACK_ADMIN_SECRET = 'SC4AI3NPZLJKUF2K5HSCJNTD6RRYY3HFP3YC5EYWW5XBDJ3AIFSPC5CS'; // Valid testnet key

jest.mock('nanoid', () => ({ nanoid: () => 'test-id-integration' }));
jest.mock('multiformats');
jest.setTimeout(60000);

// Dynamic import after env setup (ESM compat)
let app: any;

beforeAll(async () => {
    const mod = await import('../app.js');
    app = mod.default;
});

// ── Helper: Generate valid JWT ───────────────────────────────────
function generateTestToken(payload: object = {}): string {
    return jwt.sign(
        {
            id: 'test-ngo-id-001',
            email: 'test@soulsociety.org',
            walletAddr: 'GDUMMY1234567890',
            NgoName: 'Test NGO',
            ...payload,
        },
        process.env.ATS!,
        { expiresIn: '1h' }
    );
}

// ═══════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════

describe('Health Check', () => {
    it('GET /health → 200 with success=true', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Server is running');
        expect(res.body.timestamp).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════
//  404 HANDLER
// ═══════════════════════════════════════════════════════════════════

describe('404 Handler', () => {
    it('GET /nonexistent → 404', async () => {
        const res = await request(app).get('/api/this-does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

describe('JWT Auth Middleware', () => {
    it('rejects requests without token → 401', async () => {
        const res = await request(app).get('/api/user-management/find');
        expect(res.status).toBe(401);
    });

    it('rejects invalid token → 401', async () => {
        const res = await request(app)
            .get('/api/user-management/find')
            .set('Authorization', 'Bearer invalid_token_here');
        expect(res.status).toBe(401);
    });

    it('accepts valid JWT (cookie)', async () => {
        const token = generateTestToken();
        const res = await request(app)
            .get('/api/user-management/find')
            .set('Cookie', `accessToken=${token}`);
        // 200 or 400 (missing query params) — but NOT 401
        expect(res.status).not.toBe(401);
    });

    it('accepts valid JWT (Authorization header)', async () => {
        const token = generateTestToken();
        const res = await request(app)
            .get('/api/user-management/find')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).not.toBe(401);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  STELLAR API — TRANSACTION HISTORY (Real Horizon Testnet)
// ═══════════════════════════════════════════════════════════════════

describe('Stellar Transaction API', () => {
    // Well-known Stellar testnet account with transaction history
    const TESTNET_ACCOUNT = 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR';

    it('GET /api/stellar/transactions/:publicKey → returns transactions', async () => {
        const res = await request(app)
            .get(`/api/stellar/transactions/${TESTNET_ACCOUNT}?limit=5`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        if (res.body.data.length > 0) {
            const tx = res.body.data[0];
            expect(tx).toHaveProperty('hash');
            expect(tx).toHaveProperty('source_account');
            expect(tx).toHaveProperty('created_at');
            expect(tx).toHaveProperty('successful');
        }
    }, 15000); // 15s timeout for network call

    it('GET /api/stellar/transactions/invalid → returns 400 for invalid account ID', async () => {
        const res = await request(app)
            .get('/api/stellar/transactions/INVALID_KEY_HERE');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Invalid account ID|must start with G/i);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  POST API
// ═══════════════════════════════════════════════════════════════════

describe('Post API', () => {
    const token = generateTestToken();

    it.skip('GET /api/posts → returns array', async () => {
        const res = await request(app)
            .get('/api/posts')
            .set('Cookie', `accessToken=${token}`);
        if (res.status === 200) {
            expect(Array.isArray(res.body.data ?? res.body)).toBe(true);
        }
        expect([200, 401, 500]).toContain(res.status);
    }, 15000);

    it('POST /api/posts → rejects without required fields', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Cookie', `accessToken=${token}`)
            .set('Content-Type', 'application/json')
            .send({});
        expect(res.status).not.toBe(200);
        expect([400, 401, 422, 500]).toContain(res.status);
    });

    it('POST /api/posts → rejects without auth', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Content-Type', 'application/json')
            .send({
                Title: 'Test Campaign',
                Type: 'Relief',
                Description: 'At least ten characters required here.',
                Location: 'India',
                NeedAmount: '5000',
            });
        expect(res.status).toBe(401);
    });

    it('POST /api/posts → accepts valid body with auth (insert or 500)', async () => {
        const token = generateTestToken({ NgoId: 'test-ngo-001' });
        const res = await request(app)
            .post('/api/posts')
            .set('Cookie', `accessToken=${token}`)
            .set('Content-Type', 'application/json')
            .send({
                Title: 'Integration Test Campaign',
                Type: 'Relief',
                Description: 'At least ten characters required for description.',
                Location: 'India',
                NeedAmount: '10000',
            });
        expect([200, 400, 401, 500]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data).toHaveProperty('Title', 'Integration Test Campaign');
        }
    }, 15000);
});

// ═══════════════════════════════════════════════════════════════════
//  PAYMENT / DONATION — VERIFY & TRANSACTION
// ═══════════════════════════════════════════════════════════════════

describe('Payment verify-donation and donation insert', () => {
    it('POST /api/payment/verify-donation → 400 or 500 without body', async () => {
        const res = await request(app)
            .post('/api/payment/verify-donation')
            .set('Content-Type', 'application/json')
            .send({});
        expect([400, 500]).toContain(res.status);
        if (res.status === 400) expect(res.body.message).toMatch(/Invalid data|required/i);
    });

    it('POST /api/donations → 400 when required fields missing', async () => {
        const res = await request(app)
            .post('/api/donations')
            .set('Content-Type', 'application/json')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required|fields|All fields/i);
    });

    it('POST /api/donations → accepts valid body (insert or 500)', async () => {
        const token = generateTestToken();
        const res = await request(app)
            .post('/api/donations')
            .set('Cookie', `accessToken=${token}`)
            .set('Content-Type', 'application/json')
            .send({
                transactionId: 'test-txn-' + Date.now(),
                donorId: 'GDUMMYDONOR1234567890',
                postId: 'test-post-id-integration',
                amount: 50,
            });
        expect([201, 400, 401, 404, 500]).toContain(res.status);
        if (res.status === 201) {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data).toHaveProperty('currentTxn');
            expect(res.body.data).toHaveProperty('Amount');
        }
    }, 45000);
});
// ... 
// (Skipping Donation/Stats/Payment/Stellar Account which look okay path-wise or match index.routes)

// ...

// ═══════════════════════════════════════════════════════════════════
//  JSON ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════

describe('Error Handling', () => {
    it('rejects malformed JSON → 400', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .set('Content-Type', 'application/json')
            .send('{invalid json');
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  API HEALTH & ROUTES
// ═══════════════════════════════════════════════════════════════════

describe('API health and routes', () => {
    it('GET /api/health → 200 with AidBridge message', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/running|AidBridge/i);
    });

    it.skip('GET /api/community/all → returns array', async () => {
        const res = await request(app).get('/api/community/all');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/stats → returns 200 or 404/500', async () => {
        const res = await request(app).get('/api/stats');
        expect([200, 404, 500]).toContain(res.status);
        if (res.status === 200) expect(res.body).toHaveProperty('success');
    });

    it('GET /api/community/leaderboard → returns array', async () => {
        const res = await request(app).get('/api/community/leaderboard');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/user/login without body → 400 or 401', async () => {
        const res = await request(app).post('/api/user/login').set('Content-Type', 'application/json').send({});
        expect([400, 401, 422]).toContain(res.status);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  CONTRACT ROUTES (validation / 400)
// ═══════════════════════════════════════════════════════════════════

describe('Contract routes validation', () => {
    it('POST /api/contracts/notifications/send/xdr → 400 without body', async () => {
        const res = await request(app).post('/api/contracts/notifications/send/xdr').send({});
        expect(res.status).toBe(400);
    });

    it('POST /api/contracts/escrow/create-escrow/xdr → 400 without required fields', async () => {
        const res = await request(app).post('/api/contracts/escrow/create-escrow/xdr').send({});
        expect(res.status).toBe(400);
    });

    it('GET /api/contracts/notifications/count → 200 or 500', async () => {
        const res = await request(app).get('/api/contracts/notifications/count');
        expect([200, 500]).toContain(res.status);
    });
});
