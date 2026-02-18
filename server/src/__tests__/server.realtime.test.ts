/**
 * Real server tests: real-time, race conditions, server close, response loss.
 * Uses a real TCP listener (not just supertest) so we can test server.close() and in-flight requests.
 */
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import http from 'http';
import type { AddressInfo } from 'net';

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3002';
process.env.ATS = 'test_access_secret_12345';
process.env.RTS = 'test_refresh_secret_67890';
process.env.BLOCKCHAIN_NETWORK = 'https://horizon-testnet.stellar.org';
process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
process.env.STACK_ADMIN_SECRET = 'SC4AI3NPZLJKUF2K5HSCJNTD6RRYY3HFP3YC5EYWW5XBDJ3AIFSPC5CS';

jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
jest.mock('multiformats');

let app: any;
let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  const mod = await import('../app.js');
  app = mod.default;
  server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(0, () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
    server.once('error', reject);
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

function get(path: string): Promise<{ status: number; body: any; err?: Error }> {
  return getUrl(`${baseUrl}${path.startsWith('/') ? path : '/' + path}`);
}

function getUrl(fullUrl: string): Promise<{ status: number; body: any; err?: Error }> {
  return new Promise((resolve) => {
    const req = http.get(fullUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let body: any;
        try {
          body = data ? JSON.parse(data) : null;
        } catch {
          body = data;
        }
        resolve({ status: res.statusCode ?? 0, body });
      });
    });
    req.on('error', (err) => resolve({ status: 0, body: null, err }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 0, body: null, err: new Error('timeout') });
    });
  });
}

// ─── Real-time: concurrent requests get correct responses ───
describe('Real-time and concurrency', () => {
  it('handles many concurrent health checks with no response loss', async () => {
    const concurrency = 50;
    const promises = Array.from({ length: concurrency }, () => get('/health'));
    const results = await Promise.all(promises);

    const ok = results.filter((r) => r.status === 200 && r.body?.success === true);
    const failed = results.filter((r) => r.err || r.status !== 200);
    expect(ok.length).toBe(concurrency);
    expect(failed.length).toBe(0);
  });

  it('race condition: burst of requests all receive valid response', async () => {
    const burst = 100;
    const promises = Array.from({ length: burst }, () => get('/health'));
    const results = await Promise.all(promises);

    const success = results.filter((r) => r.status === 200 && r.body?.success && r.body?.timestamp);
    expect(success.length).toBe(burst);
    results.forEach((r) => {
      expect(r.status).toBe(200);
      expect(r.body).toHaveProperty('success', true);
      expect(r.body).toHaveProperty('timestamp');
    });
  });

  it('response loss: under load every request gets a response', async () => {
    const rounds = 5;
    const perRound = 20;
    const all: Promise<{ status: number; body: any; err?: Error }>[] = [];
    for (let i = 0; i < rounds; i++) {
      for (let j = 0; j < perRound; j++) {
        all.push(get('/health'));
      }
    }
    const results = await Promise.all(all);
    const total = rounds * perRound;
    const received = results.filter((r) => r.status > 0 || r.err);
    const withBody = results.filter((r) => r.status === 200 && r.body?.success);
    expect(received.length).toBe(total);
    expect(withBody.length).toBe(total);
  });
});

// ─── Server close: in-flight requests ───
describe('Server close and in-flight requests', () => {
  it('server close does not hang and in-flight requests settle', async () => {
    const testServer = http.createServer(app);
    const testBaseUrl = await new Promise<string>((resolve, reject) => {
      testServer.listen(0, () => {
        const addr = testServer.address() as AddressInfo;
        resolve(`http://127.0.0.1:${addr.port}`);
      });
      testServer.once('error', reject);
    });

    const delayMs = 150;
    const numRequests = 8;
    const promises = Array.from(
      { length: numRequests },
      () => getUrl(`${testBaseUrl}/api/test/delay?ms=${delayMs}`)
    );
    setTimeout(() => {
      testServer.close();
    }, 30);

    const results = await Promise.allSettled(promises);
    expect(results.length).toBe(numRequests);
    const values = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
    const completed = values.filter((v) => v && v.status === 200);
    const failed = values.filter((v) => v && (v.err || v.status !== 200));
    expect(completed.length + failed.length).toBe(numRequests);

    await new Promise<void>((resolve) => {
      testServer.close(() => resolve());
    });
  });

  it('after server close new connections are rejected', async () => {
    const testServer = http.createServer(app);
    const testBaseUrl = await new Promise<string>((resolve, reject) => {
      testServer.listen(0, () => {
        const addr = testServer.address() as AddressInfo;
        resolve(`http://127.0.0.1:${addr.port}`);
      });
      testServer.once('error', reject);
    });

    await new Promise<void>((resolve) => {
      testServer.close(() => resolve());
    });

    const result = await getUrl(`${testBaseUrl}/health`);
    expect(result.err != null || result.status !== 200).toBe(true);
  });
});

// ─── Ordering / real-time: rapid sequence ───
describe('Rapid sequential requests', () => {
  it('rapid sequential health checks all succeed', async () => {
    const results: { status: number; body: any }[] = [];
    for (let i = 0; i < 20; i++) {
      const r = await get('/health');
      results.push({ status: r.status, body: r.body });
    }
    expect(results.every((r) => r.status === 200 && r.body?.success)).toBe(true);
    expect(results.length).toBe(20);
  });
});
