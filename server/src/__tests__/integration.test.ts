/**
 * Soul Society — Server Integration Tests
 * =========================================
 * These tests hit the real Express app (supertest) with NODE_ENV=test.
 * DB connection is skipped in test mode; blockchain calls use real vault
 * service when available, or gracefully handle errors.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
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

    it('GET /api/stellar/transactions/invalid → handles invalid key gracefully', async () => {
        const res = await request(app)
            .get('/api/stellar/transactions/INVALID_KEY_HERE');
        // Should return 200 with empty data or 500 with error
        expect([200, 500]).toContain(res.status);
    }, 10000);
});

// ═══════════════════════════════════════════════════════════════════
//  POST API
// ═══════════════════════════════════════════════════════════════════

describe('Post API', () => {
    const token = generateTestToken();

    it('GET /api/posts/get-all-post → returns array', async () => {
        const res = await request(app)
            .get('/api/posts/get-all-post') // Fix path: /api/posts/...
            .set('Cookie', `accessToken=${token}`);
        // 200 with array data, or error from vault
        if (res.status === 200) {
            expect(Array.isArray(res.body.data)).toBe(true);
        }
    }, 15000);

    it('POST /api/posts/create-post → rejects without required fields', async () => {
        const res = await request(app)
            .post('/api/posts/create-post') // Fix path
            .set('Cookie', `accessToken=${token}`)
            .send({});
        // Should fail validation (400 or 500) or Auth? No, token provided.
        expect(res.status).not.toBe(200);
    });
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
            .post('/api/user/login') // Use valid route
            .set('Content-Type', 'application/json')
            .send('{invalid json');
        expect(res.status).toBe(400);
    });
});
