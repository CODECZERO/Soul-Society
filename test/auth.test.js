const request = require('supertest');
const { createTestUser } = require('./factories/user-factory');

// Import mocks
require('./mocks/stellar-mock');

describe('Authentication API', () => {
  let testUser;
  let accessToken;

  beforeEach(async () => {
    // Create a test user and get tokens
    testUser = await createTestUser();
    const tokens = testEnv.generateTokens(
      testUser._id,
      testUser.Email,
      testUser.NgoName,
      testUser.PublicKey
    );
    accessToken = tokens.accessToken;
  });

  describe('POST /api/user/signup', () => {
    it('should register a new NGO with valid data', async () => {
      const userData = {
        ngoName: 'Test NGO',
        regNumber: 'REG123456',
        description: 'Test NGO description',
        email: 'test@example.com',
        phoneNo: '+1234567890',
        password: 'TestPassword123!'
      };

      const response = await request(testEnv.app)
        .post('/api/user/signup')
        .send(userData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          userData: {
            NgoName: userData.ngoName,
            Email: userData.email
          }
        }
      });
    });
  });

  describe('POST /api/user/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: testUser.Email,
        password: 'TestPassword123!'
      };

      const response = await request(testEnv.app)
        .post('/api/user/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('data.accessToken');
      expect(response.body).toHaveProperty('data.refreshToken');
    });
  });
});
