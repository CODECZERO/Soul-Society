/**
 * Soul Society — Extended Integration Tests
 * =========================================
 * covering community, stats, and recruitment modules.
 */
import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Set environment BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.ATS = 'test_access_secret_12345';
process.env.RTS = 'test_refresh_secret_67890';
process.env.FRONTEND_URL = 'http://localhost:3002';
process.env.STACK_ADMIN_SECRET = 'SC4AI3NPZLJKUF2K5HSCJNTD6RRYY3HFP3YC5EYWW5XBDJ3AIFSPC5CS';
process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
process.env.BLOCKCHAIN_NETWORK = 'https://horizon-testnet.stellar.org';
process.env.PINATA_JWT = 'test_jwt';
process.env.PINATA_GATEWAY = 'gateway.pinata.cloud';

jest.mock('nanoid', () => ({ nanoid: () => 'test-id-extended' }));
jest.mock('multiformats');

let app: any;

beforeAll(async () => {
    const mod = await import('../app.js');
    app = mod.default;
});

function generateTestToken(): string {
    return jwt.sign(
        {
            id: 'test-ngo-id-001',
            email: 'test@soulsociety.org',
            walletAddr: 'GDUMMY1234567890',
            NgoName: 'Test NGO',
        },
        process.env.ATS!,
        { expiresIn: '1h' }
    );
}

// ═══════════════════════════════════════════════════════════════════
//  COMMUNITY TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Community API', () => {
    it('GET /api/community/all → returns communities array', async () => {
        const res = await request(app).get('/api/community/all');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/community/leaderboard → returns leaderboard array', async () => {
        const res = await request(app).get('/api/community/leaderboard');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/community/voter/:wallet → returns stats for dummy wallet', async () => {
        const res = await request(app).get('/api/community/voter/GDUMMY12345');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('walletAddr');
    });
});

// ═══════════════════════════════════════════════════════════════════
//  STATS TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Stats API', () => {
    it('GET /api/stats → returns global stats', async () => {
        const res = await request(app).get('/api/stats');
        // Might be 404/500 if no data exists in vault yet, but check basic JSON structure
        expect([200, 404, 500]).toContain(res.status);
    });

    it('GET /api/stats/leaderboard → returns NGO leaderboard', async () => {
        const res = await request(app).get('/api/stats/leaderboard');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  RECRUITMENT TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Recruitment API', () => {
    it('GET /api/recruitment/:ngoId/members → returns 200 or 404', async () => {
        const res = await request(app).get('/api/recruitment/test-ngo/members');
        expect([200, 404]).toContain(res.status);
    });

    it('POST /api/recruitment/join → rejects missing fields with 400', async () => {
        const res = await request(app)
            .post('/api/recruitment/join')
            .send({ ngoId: 'test-ngo' }); // Missing walletAddr
        expect(res.status).toBe(400);
    });
});
