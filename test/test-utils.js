const { TestDatabase, TestUserManager } = require('./test-backend-setup');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { faker } = require('@faker-js/faker');

// Test data generators
const generateTestUser = (overrides = {}) => ({
  NgoName: faker.company.name(),
  RegNumber: `REG${faker.datatype.number({ min: 100000, max: 999999 })}`,
  Email: faker.internet.email(),
  PhoneNo: faker.phone.number('+1##########'),
  Description: faker.lorem.paragraph(),
  Password: 'TestPassword123!',
  PublicKey: `G${faker.random.alphaNumeric(55)}`,
  PrivateKey: `S${faker.random.alphaNumeric(55)}`,
  ...overrides
});

const generateTestPost = (overrides = {}) => ({
  Title: faker.lorem.words(3),
  Type: faker.helpers.arrayElement(['Education', 'Healthcare', 'Environment', 'Disaster Relief']),
  Description: faker.lorem.paragraphs(2),
  TargetAmount: faker.finance.amount(1000, 100000, 2),
  CurrentAmount: 0,
  Deadline: faker.date.future(),
  Status: 'Active',
  Images: [faker.image.imageUrl()],
  ...overrides
});

const generateTestDonation = (overrides = {}) => ({
  Amount: faker.finance.amount(10, 1000, 2),
  Currency: 'XLM',
  TransactionHash: `0x${faker.random.alphaNumeric(64)}`,
  DonorAddress: `G${faker.random.alphaNumeric(55)}`,
  Message: faker.lorem.sentence(),
  Status: 'completed',
  ...overrides
});

class TestEnvironment {
  constructor() {
    this.testDB = new TestDatabase();
    this.userManager = new TestUserManager();
    this.app = null;
    this.server = null;
    this.accessToken = null;
    this.refreshToken = null;
  }

  async start() {
    await this.testDB.start();
    const { default: expressApp } = await import('../dist/app.js');
    this.app = expressApp;
    this.server = this.app.listen(0);
    return this;
  }

  async stop() {
    if (this.server) {
      await new Promise(resolve => this.server.close(resolve));
    }
    await this.testDB.clear();
    await this.testDB.stop();
  }

  // User management
  async createTestUser(overrides = {}) {
    return this.userManager.createTestUser(generateTestUser(overrides));
  }

  async createAuthenticatedUser(role = 'user', overrides = {}) {
    const user = await this.createTestUser({ ...overrides, role });
    const tokens = this.generateTokens(
      user._id,
      user.Email,
      user.NgoName,
      user.PublicKey
    );
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    return { user, tokens };
  }

  // Token management
  generateTokens(userId, email, ngoName, publicKey) {
    const accessToken = jwt.sign(
      { id: userId, email, ngoName, publicKey },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
  }

  // Test data creation
  async createTestPost(overrides = {}) {
    if (!overrides.NGOID && !overrides.user) {
      const { user } = await this.createAuthenticatedUser();
      overrides.NGOID = user._id;
    } else if (overrides.user) {
      overrides.NGOID = overrides.user._id;
      delete overrides.user;
    }
    return this.userManager.createTestPost(generateTestPost(overrides));
  }

  async createTestDonation(overrides = {}) {
    if (!overrides.postId) {
      const post = await this.createTestPost();
      overrides.postId = post._id;
    }
    if (!overrides.donorId) {
      const { user } = await this.createAuthenticatedUser();
      overrides.donorId = user._id;
    }
    return this.userManager.createTestDonation(generateTestDonation(overrides));
  }

  // Request helpers
  async getRequest(path, headers = {}) {
    const req = request(this.app).get(path);
    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }
    return req.set(headers);
  }

  async postRequest(path, data = {}, headers = {}) {
    const req = request(this.app).post(path);
    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }
    return req.set(headers).send(data);
  }

  async putRequest(path, data = {}, headers = {}) {
    const req = request(this.app).put(path);
    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }
    return req.set(headers).send(data);
  }

  async deleteRequest(path, headers = {}) {
    const req = request(this.app).delete(path);
    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }
    return req.set(headers);
  }
}

// Export test data generators and environment
module.exports = {
  TestEnvironment,
  generateTestUser,
  generateTestPost,
  generateTestDonation
};
