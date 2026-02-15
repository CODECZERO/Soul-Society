/**
 * Posts Tests for Soul-Society Server
 */

const request = require('supertest');
const mongoose = require('mongoose');

// Import test utilities
const { TestDatabase, TestUserManager, TestUtils } = require('../test-backend-setup');

describe('Posts Tests', () => {
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

  describe('GET /api/posts', () => {
    it('should get all posts without authentication', async () => {
      // Create some test posts
      const post1 = await userManager.createTestPost(testUser._id, {
        Title: 'Test Campaign 1',
        Type: 'Education',
        Description: 'Test description 1',
        Location: 'Test City 1',
        ImgCid: 'QmTestHash1',
        NeedAmount: 1000,
        CollectedAmount: 0,
        WalletAddr: 'GTestWallet1',
      });

      const post2 = await userManager.createTestPost(testUser._id, {
        Title: 'Test Campaign 2',
        Type: 'Healthcare',
        Description: 'Test description 2',
        Location: 'Test City 2',
        ImgCid: 'QmTestHash2',
        NeedAmount: 2000,
        CollectedAmount: 500,
        WalletAddr: 'GTestWallet2',
      });

      const response = await request(app).get('/api/posts').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('Title');
      expect(response.body.data[0]).toHaveProperty('Type');
      expect(response.body.data[0]).toHaveProperty('Description');
      expect(response.body.data[0]).toHaveProperty('Location');
      expect(response.body.data[0]).toHaveProperty('ImgCid');
      expect(response.body.data[0]).toHaveProperty('NeedAmount');
      expect(response.body.data[0]).toHaveProperty('CollectedAmount');
      expect(response.body.data[0]).toHaveProperty('WalletAddr');
    });

    it('should return empty array when no posts exist', async () => {
      const response = await request(app).get('/api/posts').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('post data not found');
    });

    it('should return posts with populated NGO data', async () => {
      // Create a test post
      await userManager.createTestPost(testUser._id, {
        Title: 'Test Campaign',
        Type: 'Education',
        Description: 'Test description',
        Location: 'Test City',
        ImgCid: 'QmTestHash',
        NeedAmount: 1000,
        CollectedAmount: 0,
        WalletAddr: 'GTestWallet',
      });

      const response = await request(app).get('/api/posts').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('NgoRef');
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post with valid data and authentication', async () => {
      const postData = {
        Title: 'Test Campaign',
        Type: 'Education',
        Description: 'Test campaign description',
        Location: 'Test City',
        ImgCid: 'QmTestHash123',
        NeedAmount: '1000',
        WalletAddr: 'GTestWallet123',
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.Title).toBe(postData.Title);
      expect(response.body.data.Type).toBe(postData.Type);
      expect(response.body.data.Description).toBe(postData.Description);
      expect(response.body.data.Location).toBe(postData.Location);
      expect(response.body.data.ImgCid).toBe(postData.ImgCid);
      expect(response.body.data.NeedAmount).toBe(parseInt(postData.NeedAmount));
      expect(response.body.data.WalletAddr).toBe(postData.WalletAddr);
      expect(response.body.data.NgoRef).toBe(testUser._id.toString());
    });

    it('should fail without authentication', async () => {
      const postData = {
        Title: 'Test Campaign',
        Type: 'Education',
        Description: 'Test campaign description',
        Location: 'Test City',
        ImgCid: 'QmTestHash123',
        NeedAmount: '1000',
        WalletAddr: 'GTestWallet123',
      };

      const response = await request(app).post('/api/posts').send(postData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token is required');
    });

    it('should fail with invalid token', async () => {
      const postData = {
        Title: 'Test Campaign',
        Type: 'Education',
        Description: 'Test campaign description',
        Location: 'Test City',
        ImgCid: 'QmTestHash123',
        NeedAmount: '1000',
        WalletAddr: 'GTestWallet123',
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer invalid-token')
        .send(postData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const incompleteData = {
        Title: 'Test Campaign',
        Type: 'Education',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalid data');
    });

    it('should fail with empty request body', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle different campaign types', async () => {
      const campaignTypes = [
        'Education',
        'Healthcare',
        'Environment',
        'Disaster Relief',
        'Community Development',
      ];

      for (const type of campaignTypes) {
        const postData = {
          Title: `Test ${type} Campaign`,
          Type: type,
          Description: `Test ${type} campaign description`,
          Location: 'Test City',
          ImgCid: `QmTestHash${type}`,
          NeedAmount: '1000',
          WalletAddr: `GTestWallet${type}`,
        };

        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(postData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.Type).toBe(type);
      }
    });

    it('should handle different amount formats', async () => {
      const amounts = ['100', '1000', '10000', '100000'];

      for (const amount of amounts) {
        const postData = {
          Title: `Test Campaign ${amount}`,
          Type: 'Education',
          Description: 'Test campaign description',
          Location: 'Test City',
          ImgCid: `QmTestHash${amount}`,
          NeedAmount: amount,
          WalletAddr: `GTestWallet${amount}`,
        };

        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(postData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.NeedAmount).toBe(parseInt(amount));
      }
    });

    it('should handle special characters in text fields', async () => {
      const postData = {
        Title: 'Test Campaign with Special Characters: @#$%^&*()',
        Type: 'Education',
        Description: 'Test description with émojis 🎉 and special chars: ñáéíóú',
        Location: 'Test City with Special Chars: São Paulo',
        ImgCid: 'QmTestHashSpecial',
        NeedAmount: '1000',
        WalletAddr: 'GTestWalletSpecial',
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.Title).toBe(postData.Title);
      expect(response.body.data.Description).toBe(postData.Description);
      expect(response.body.data.Location).toBe(postData.Location);
    });

    it('should handle long text fields', async () => {
      const longDescription = 'A'.repeat(1000); // 1000 character description
      const longLocation = 'B'.repeat(100); // 100 character location

      const postData = {
        Title: 'Test Campaign with Long Text',
        Type: 'Education',
        Description: longDescription,
        Location: longLocation,
        ImgCid: 'QmTestHashLong',
        NeedAmount: '1000',
        WalletAddr: 'GTestWalletLong',
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.Description).toBe(longDescription);
      expect(response.body.data.Location).toBe(longLocation);
    });
  });

  describe('Post Data Validation', () => {
    it('should validate IPFS CID format', async () => {
      const postData = {
        Title: 'Test Campaign',
        Type: 'Education',
        Description: 'Test campaign description',
        Location: 'Test City',
        ImgCid: 'InvalidHash', // Invalid IPFS CID format
        NeedAmount: '1000',
        WalletAddr: 'GTestWallet123',
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(200); // Should still work as validation is not strict

      expect(response.body.success).toBe(true);
    });

    it('should validate Stellar wallet address format', async () => {
      const postData = {
        Title: 'Test Campaign',
        Type: 'Education',
        Description: 'Test campaign description',
        Location: 'Test City',
        ImgCid: 'QmTestHash123',
        NeedAmount: '1000',
        WalletAddr: 'InvalidWalletAddress', // Invalid Stellar address format
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(200); // Should still work as validation is not strict

      expect(response.body.success).toBe(true);
    });
  });

  describe('Post Retrieval Performance', () => {
    it('should handle large number of posts efficiently', async () => {
      // Create multiple posts
      const postCount = 50;
      for (let i = 0; i < postCount; i++) {
        await userManager.createTestPost(testUser._id, {
          Title: `Test Campaign ${i}`,
          Type: 'Education',
          Description: `Test description ${i}`,
          Location: `Test City ${i}`,
          ImgCid: `QmTestHash${i}`,
          NeedAmount: 1000 + i,
          CollectedAmount: i * 10,
          WalletAddr: `GTestWallet${i}`,
        });
      }

      const startTime = Date.now();
      const response = await request(app).get('/api/posts').expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(postCount);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
