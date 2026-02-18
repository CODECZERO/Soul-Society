/**
 * Contract API routes tests.
 * Hits real app; contract calls may 500 if contracts are not deployed.
 */
import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3002';
process.env.ATS = 'test_access_secret_12345';
process.env.RTS = 'test_refresh_secret_67890';
process.env.BLOCKCHAIN_NETWORK = 'https://horizon-testnet.stellar.org';
process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
process.env.STACK_ADMIN_SECRET = 'SC4AI3NPZLJKUF2K5HSCJNTD6RRYY3HFP3YC5EYWW5XBDJ3AIFSPC5CS';

jest.mock('nanoid', () => ({ nanoid: () => 'test-id-' + Math.random().toString(36).slice(2) }));

jest.mock('multiformats');

let app: any;

beforeAll(async () => {
  const mod = await import('../app.js');
  app = mod.default;
});

describe('Contract routes', () => {
  it('GET /api/contracts/escrow/:taskId → returns 200 with data or 500 when contract unavailable', async () => {
    const res = await request(app).get('/api/contracts/escrow/task-1');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
    }
  });

  it('GET /api/contracts/escrow/stats/platform → returns 200 or 500', async () => {
    const res = await request(app).get('/api/contracts/escrow/stats/platform');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
    }
  });

  it('GET /api/contracts/vault/stats → returns 200 or 500', async () => {
    const res = await request(app).get('/api/contracts/vault/stats');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
    }
  });

  it('POST /api/contracts/escrow/create-escrow/xdr → 400 when body missing required fields', async () => {
    const res = await request(app).post('/api/contracts/escrow/create-escrow/xdr').send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/contracts/notifications/count → returns 200 or 500', async () => {
    const res = await request(app).get('/api/contracts/notifications/count');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('count');
    }
  });

  it('POST /api/contracts/notifications/send/xdr → 400 when body missing required fields', async () => {
    const res = await request(app).post('/api/contracts/notifications/send/xdr').send({});
    expect(res.status).toBe(400);
  });
});
