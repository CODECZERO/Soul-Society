/**
 * Authentication Tests for Soul-Society Server
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import test utilities
const { TestDatabase, TestUserManager, TestUtils } = require('../test-backend-setup');

describe('Authentication Tests', () => {
  let testDB;
  let userManager;
  let app;
  let server;

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
  });

  describe('POST /api/user/signup', () => {
    it('should register a new NGO with valid data', async () => {
      const userData = {
        ngoName: 'Test NGO',
        regNumber: 'REG123456',
        description: 'Test NGO description',
        email: 'test@ngo.com',
        phoneNo: '+1234567890',
        password: 'TestPassword123',
      };

      const response = await request(app).post('/api/user/signup').send(userData).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('userData');
      expect(response.body.data).toHaveProperty('blockchainAccount');
      expect(response.body.data.userData.NgoName).toBe(userData.ngoName);
      expect(response.body.data.userData.Email).toBe(userData.email);
    });

    it('should fail with duplicate email', async () => {
      // Create first user
      const userData = {
        ngoName: 'Test NGO 1',
        regNumber: 'REG123456',
        description: 'Test NGO description',
        email: 'test@ngo.com',
        phoneNo: '+1234567890',
        password: 'TestPassword123',
      };

      await request(app).post('/api/user/signup').send(userData).expect(200);

      // Try to create second user with same email
      const duplicateUserData = {
        ...userData,
        ngoName: 'Test NGO 2',
        regNumber: 'REG123457',
      };

      const response = await request(app)
        .post('/api/user/signup')
        .send(duplicateUserData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User already exists');
    });

    it('should fail with missing required fields', async () => {
      const incompleteData = {
        ngoName: 'Test NGO',
        email: 'test@ngo.com',
        // Missing required fields
      };

      const response = await request(app).post('/api/user/signup').send(incompleteData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        ngoName: 'Test NGO',
        regNumber: 'REG123456',
        description: 'Test NGO description',
        email: 'invalid-email',
        phoneNo: '+1234567890',
        password: 'TestPassword123',
      };

      const response = await request(app).post('/api/user/signup').send(userData).expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      testUser = await userManager.createTestUser();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: testUser.Email,
        password: 'TestPassword123', // Original password before hashing
      };

      const response = await request(app).post('/api/user/login').send(loginData).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('userData');
      expect(response.body.data.userData.Email).toBe(testUser.Email);

      // Check if cookies are set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies.some((cookie) => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some((cookie) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should fail with invalid password', async () => {
      const loginData = {
        email: testUser.Email,
        password: 'WrongPassword',
      };

      const response = await request(app).post('/api/user/login').send(loginData).expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@ngo.com',
        password: 'TestPassword123',
      };

      const response = await request(app).post('/api/user/login').send(loginData).expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app).post('/api/user/login').send({}).expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/refresh', () => {
    let testUser;
    let refreshToken;

    beforeEach(async () => {
      // Create a test user
      testUser = await userManager.createTestUser();
      const tokens = userManager.generateTokens(
        testUser._id,
        testUser.Email,
        testUser.NgoName,
        testUser.PublicKey
      );
      refreshToken = tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/user/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('userData');

      // Check if new cookies are set
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/user/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired refresh token');
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app).post('/api/user/refresh').send({}).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token is required');
    });

    it('should fail with expired refresh token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: testUser._id, walletAddr: testUser.PublicKey },
        process.env.RTS || 'test-refresh-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .post('/api/user/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Token Validation', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      testUser = await userManager.createTestUser();
      const tokens = userManager.generateTokens(
        testUser._id,
        testUser.Email,
        testUser.NgoName,
        testUser.PublicKey
      );
      accessToken = tokens.accessToken;
    });

    it('should validate correct access token', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid access token', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject expired access token', async () => {
      const expiredToken = jwt.sign(
        {
          id: testUser._id,
          userId: testUser._id,
          email: testUser.Email,
          NgoName: testUser.NgoName,
          walletAddr: testUser.PublicKey,
        },
        process.env.ATS || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request without token', async () => {
      const response = await request(app).post('/api/posts').send({}).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token is required');
    });
  });

  describe('Password Security', () => {
    it('should hash passwords before saving', async () => {
      const userData = {
        ngoName: 'Test NGO',
        regNumber: 'REG123456',
        description: 'Test NGO description',
        email: 'test@ngo.com',
        phoneNo: '+1234567890',
        password: 'TestPassword123',
      };

      await request(app).post('/api/user/signup').send(userData).expect(200);

      // Check if password is hashed in database
      const UserModel = mongoose.model('ngomodel');
      const savedUser = await UserModel.findOne({ email: userData.email });

      expect(savedUser.Password).not.toBe(userData.password);
      expect(savedUser.Password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should verify passwords correctly', async () => {
      const userData = {
        ngoName: 'Test NGO',
        regNumber: 'REG123456',
        description: 'Test NGO description',
        email: 'test@ngo.com',
        phoneNo: '+1234567890',
        password: 'TestPassword123',
      };

      await request(app).post('/api/user/signup').send(userData).expect(200);

      // Test login with correct password
      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });
});
