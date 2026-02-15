/**
 * Stellar Blockchain Tests for Soul-Society Server
 * Note: These tests may require actual Stellar testnet connection
 */

const request = require('supertest');
const mongoose = require('mongoose');

// Import test utilities
const { TestDatabase, TestUserManager, TestUtils } = require('../test-backend-setup');

describe('Stellar Blockchain Tests', () => {
  let testDB;
  let userManager;
  let app;
  let server;
  let testUser;
  let accessToken;

  beforeAll(async () => {
    // Setup test database
    testDB = new TestDatabase();
    await testDB.start();

    // Setup user manager
    userManager = new TestUserManager();

    // Import and start app
    const { default: expressApp } = await import('../dist/app.js');
    app = expressApp;

    server = app.listen(0); // Use random port for testing
  });

  afterAll(async () => {
    // Cleanup
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await testDB.clear();
    await testDB.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await testDB.clear();

    // Create test user and get access token
    testUser = await userManager.createTestUser();
    const tokens = userManager.generateTokens(
      testUser._id,
      testUser.Email,
      testUser.NgoName,
      testUser.PublicKey
    );
    accessToken = tokens.accessToken;
  });

  describe('GET /api/stellar/balance/:publicKey', () => {
    it('should get wallet balance for valid public key', async () => {
      const publicKey = testUser.PublicKey;

      const response = await request(app).get(`/api/stellar/balance/${publicKey}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('balance');
      expect(response.body.data).toHaveProperty('asset_type');
    });

    it('should fail with invalid public key format', async () => {
      const invalidPublicKey = 'invalid-key';

      const response = await request(app)
        .get(`/api/stellar/balance/${invalidPublicKey}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing public key', async () => {
      const response = await request(app).get('/api/stellar/balance/').expect(404);
    });

    it('should handle empty public key', async () => {
      const response = await request(app).get('/api/stellar/balance/').expect(404);
    });
  });

  describe('POST /api/stellar/send-payment', () => {
    it('should send payment with valid data', async () => {
      const paymentData = {
        senderKey: testUser.PrivateKey,
        receiverKey: 'GTestReceiverKey123',
        amount: 100,
        meta: {
          cid: 'QmTestHash123',
          prevTxn: 'prev-txn-hash',
        },
      };

      const response = await request(app)
        .post('/api/stellar/send-payment')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transaction');
    });

    it('should fail with missing payment data', async () => {
      const response = await request(app).post('/api/stellar/send-payment').send({}).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid sender key', async () => {
      const paymentData = {
        senderKey: 'invalid-sender-key',
        receiverKey: 'GTestReceiverKey123',
        amount: 100,
        meta: {
          cid: 'QmTestHash123',
          prevTxn: 'prev-txn-hash',
        },
      };

      const response = await request(app)
        .post('/api/stellar/send-payment')
        .send(paymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid receiver key', async () => {
      const paymentData = {
        senderKey: testUser.PrivateKey,
        receiverKey: 'invalid-receiver-key',
        amount: 100,
        meta: {
          cid: 'QmTestHash123',
          prevTxn: 'prev-txn-hash',
        },
      };

      const response = await request(app)
        .post('/api/stellar/send-payment')
        .send(paymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail with negative amount', async () => {
      const paymentData = {
        senderKey: testUser.PrivateKey,
        receiverKey: 'GTestReceiverKey123',
        amount: -100,
        meta: {
          cid: 'QmTestHash123',
          prevTxn: 'prev-txn-hash',
        },
      };

      const response = await request(app)
        .post('/api/stellar/send-payment')
        .send(paymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail with zero amount', async () => {
      const paymentData = {
        senderKey: testUser.PrivateKey,
        receiverKey: 'GTestReceiverKey123',
        amount: 0,
        meta: {
          cid: 'QmTestHash123',
          prevTxn: 'prev-txn-hash',
        },
      };

      const response = await request(app)
        .post('/api/stellar/send-payment')
        .send(paymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle different amount values', async () => {
      const amounts = [1, 10, 100, 1000, 10000];

      for (const amount of amounts) {
        const paymentData = {
          senderKey: testUser.PrivateKey,
          receiverKey: 'GTestReceiverKey123',
          amount: amount,
          meta: {
            cid: `QmTestHash${amount}`,
            prevTxn: `prev-txn-hash-${amount}`,
          },
        };

        const response = await request(app)
          .post('/api/stellar/send-payment')
          .send(paymentData)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/stellar/verify/:transactionId', () => {
    it('should verify valid transaction', async () => {
      const transactionId = 'test-transaction-id';

      const response = await request(app).get(`/api/stellar/verify/${transactionId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should fail with invalid transaction ID', async () => {
      const invalidTransactionId = 'invalid-txn-id';

      const response = await request(app)
        .get(`/api/stellar/verify/${invalidTransactionId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Transaction not found');
    });

    it('should fail with missing transaction ID', async () => {
      const response = await request(app).get('/api/stellar/verify/').expect(404);
    });

    it('should handle empty transaction ID', async () => {
      const response = await request(app).get('/api/stellar/verify/').expect(404);
    });
  });

  describe('POST /api/stellar/create-account', () => {
    it('should create new Stellar account', async () => {
      const response = await request(app).post('/api/stellar/create-account').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('publicKey');
      expect(response.body.data).toHaveProperty('secret');
    });

    it('should create unique accounts', async () => {
      const response1 = await request(app).post('/api/stellar/create-account').expect(200);

      const response2 = await request(app).post('/api/stellar/create-account').expect(200);

      expect(response1.body.data.publicKey).not.toBe(response2.body.data.publicKey);
      expect(response1.body.data.secret).not.toBe(response2.body.data.secret);
    });
  });

  describe('DELETE /api/stellar/delete-account', () => {
    it('should delete Stellar account with valid data', async () => {
      const deleteData = {
        secret: testUser.PrivateKey,
        destination: 'GTestDestinationKey123',
      };

      const response = await request(app)
        .delete('/api/stellar/delete-account')
        .send(deleteData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with missing secret', async () => {
      const deleteData = {
        destination: 'GTestDestinationKey123',
      };

      const response = await request(app)
        .delete('/api/stellar/delete-account')
        .send(deleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing destination', async () => {
      const deleteData = {
        secret: testUser.PrivateKey,
      };

      const response = await request(app)
        .delete('/api/stellar/delete-account')
        .send(deleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid secret', async () => {
      const deleteData = {
        secret: 'invalid-secret',
        destination: 'GTestDestinationKey123',
      };

      const response = await request(app)
        .delete('/api/stellar/delete-account')
        .send(deleteData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/stellar/smart-contract', () => {
    it('should save data to smart contract with valid data', async () => {
      const contractData = {
        privateKey: testUser.PrivateKey,
        reciverKey: 'GTestReceiverKey123',
        amount: 100,
        cid: 'QmTestHash123',
        prevTxn: 'prev-txn-hash',
        metadata: 'Test metadata',
      };

      const response = await request(app)
        .post('/api/stellar/smart-contract')
        .send(contractData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with missing private key', async () => {
      const contractData = {
        reciverKey: 'GTestReceiverKey123',
        amount: 100,
        cid: 'QmTestHash123',
        prevTxn: 'prev-txn-hash',
      };

      const response = await request(app)
        .post('/api/stellar/smart-contract')
        .send(contractData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing receiver key', async () => {
      const contractData = {
        privateKey: testUser.PrivateKey,
        amount: 100,
        cid: 'QmTestHash123',
        prevTxn: 'prev-txn-hash',
      };

      const response = await request(app)
        .post('/api/stellar/smart-contract')
        .send(contractData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing amount', async () => {
      const contractData = {
        privateKey: testUser.PrivateKey,
        reciverKey: 'GTestReceiverKey123',
        cid: 'QmTestHash123',
        prevTxn: 'prev-txn-hash',
      };

      const response = await request(app)
        .post('/api/stellar/smart-contract')
        .send(contractData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle optional metadata', async () => {
      const contractData = {
        privateKey: testUser.PrivateKey,
        reciverKey: 'GTestReceiverKey123',
        amount: 100,
        cid: 'QmTestHash123',
        prevTxn: 'prev-txn-hash',
        // metadata is optional
      };

      const response = await request(app)
        .post('/api/stellar/smart-contract')
        .send(contractData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/stellar/get-latest-data', () => {
    it('should get latest contract data with valid private key', async () => {
      const requestData = {
        privateKey: testUser.PrivateKey,
      };

      const response = await request(app)
        .post('/api/stellar/get-latest-data')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with missing private key', async () => {
      const response = await request(app).post('/api/stellar/get-latest-data').send({}).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid private key', async () => {
      const requestData = {
        privateKey: 'invalid-private-key',
      };

      const response = await request(app)
        .post('/api/stellar/get-latest-data')
        .send(requestData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Stellar Network Integration', () => {
    it('should handle network connectivity issues gracefully', async () => {
      // This test would require mocking network failures
      const publicKey = testUser.PublicKey;

      const response = await request(app).get(`/api/stellar/balance/${publicKey}`).expect(200);

      // The response should be handled gracefully even if network fails
      expect(response.body).toHaveProperty('success');
    });

    it('should handle rate limiting', async () => {
      // Test multiple rapid requests
      const publicKey = testUser.PublicKey;
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get(`/api/stellar/balance/${publicKey}`));
      }

      const responses = await Promise.all(promises);

      // All requests should be handled (may succeed or fail gracefully)
      responses.forEach((response) => {
        expect(response.body).toHaveProperty('success');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request data', async () => {
      const malformedData = {
        senderKey: testUser.PrivateKey,
        receiverKey: 'GTestReceiverKey123',
        amount: 'not-a-number', // Invalid amount type
        meta: {
          cid: 'QmTestHash123',
          prevTxn: 'prev-txn-hash',
        },
      };

      const response = await request(app)
        .post('/api/stellar/send-payment')
        .send(malformedData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing meta data', async () => {
      const paymentData = {
        senderKey: testUser.PrivateKey,
        receiverKey: 'GTestReceiverKey123',
        amount: 100,
        // Missing meta field
      };

      const response = await request(app)
        .post('/api/stellar/send-payment')
        .send(paymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
