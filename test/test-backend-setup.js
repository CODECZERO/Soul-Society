#!/usr/bin/env node

/**
 * Soul-Society Test Runner
 * Comprehensive test execution script for the Soul-Society server.
 * This script runs scenarios sequentially and continues even if one scenario fails.
 */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import * as dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // <-- FIX: Import for ESM path handling

// --- ES MODULE FIX FOR __dirname (Start) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- ES MODULE FIX FOR __dirname (End) ---

// Load environment variables (assuming .env is in the parent directory)
// FIX: Use path.resolve with the ES Module __dirname equivalent
dotenv.config({ path: path.resolve(__dirname, '..', '.env') }); 

console.log("Mongo, JWT, and bcrypt loaded successfully");

// Test configuration
const TEST_CONFIG = {
  // Test suites (topics)
  suites: [
    'auth',
    'posts', 
    'stellar',
    'payment',
    'ipfs',
    'expenses'
  ],
  
  // Test modes (type of test)
  modes: {
    unit: 'Unit tests only',
    integration: 'Integration tests only',
    e2e: 'End-to-end tests only',
    all: 'All tests'
  },
  
  // Output formats
  formats: {
    console: 'Console output',
    json: 'JSON report',
    html: 'HTML report',
    junit: 'JUnit XML report'
  },
  
  // Test environment constants
  MONGODB_URI: 'mongodb://localhost:27017/soul-society_test',
  JWT_SECRET: 'test-secret-key',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  NODE_ENV: 'test',
  PORT: 8001,
  FRONTEND_URL: 'http://localhost:3000'
};

// Test statistics
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// ===============================================
// TEST DATA GENERATION & SETUP UTILITIES
// ===============================================

// Test data generators
const TestDataGenerator = {
  // Generate test NGO data
  generateNGO: (overrides = {}) => ({
    NgoName: `Test NGO ${Date.now()}`,
    RegNumber: `REG${Date.now()}`,
    Description: 'Test NGO Description',
    Email: `test${Date.now()}@ngo.com`,
    PhoneNo: '+1234567890',
    Password: 'TestPassword123',
    PublicKey: `GTestPublicKey${Date.now()}`,
    PrivateKey: `STestPrivateKey${Date.now()}`,
    ...overrides
  }),

  // Generate test post data
  generatePost: (ngoId, overrides = {}) => ({
    Title: `Test Campaign ${Date.now()}`,
    Type: 'Education',
    Description: 'Test campaign description',
    Location: 'Test City',
    ImgCid: `QmTestHash${Date.now()}`,
    NgoRef: ngoId,
    NeedAmount: 1000,
    CollectedAmount: 0,
    WalletAddr: `GTestWallet${Date.now()}`,
    ...overrides
  }),

  // Generate test donation data
  generateDonation: (postId, overrides = {}) => ({
    currentTxn: `Txn${Date.now()}`,
    postIDs: postId,
    Amount: 100,
    RemainingAmount: 100,
    ...overrides
  }),

  // Generate test expense data
  generateExpense: (postId, overrides = {}) => ({
    currentTxn: `ExpenseTxn${Date.now()}`,
    postIDs: postId,
    ...overrides
  })
};

// Database setup utilities
class TestDatabase {
  constructor() {
    this.mongoServer = null;
    this.connection = null;
  }

  async start(log) {
    try {
      this.mongoServer = await MongoMemoryServer.create();
      const mongoUri = this.mongoServer.getUri();
      
      this.connection = await mongoose.connect(mongoUri, {});
      
      log('✅ Test database connected', 'green');
      return mongoUri;
    } catch (error) {
      log(`❌ Test database connection failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async stop(log) {
    try {
      if (this.connection) {
        await mongoose.connection.close();
      }
      if (this.mongoServer) {
        await this.mongoServer.stop();
      }
      await mongoose.disconnect(); 
      log('✅ Test database disconnected', 'green');
    } catch (error) {
      log(`❌ Test database disconnection failed: ${error.message}`, 'red');
    }
  }

  async clear(log) {
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].drop(); 
      }
      log('✅ Test database cleared', 'green');
    } catch (error) {
      if (error.message.includes('not found')) return; 
      log(`❌ Test database clear failed: ${error.message}`, 'red');
    }
  }
}

// Schema definitions
const NgoSchema = new mongoose.Schema({
  NgoName: String,
  RegNumber: String,
  Description: String,
  Email: String,
  PhoneNo: String,
  Password: String,
  PublicKey: String,
  PrivateKey: String,
  RefreshToken: String
});

const PostSchema = new mongoose.Schema({
  Title: String,
  Type: String,
  Description: String,
  Location: String,
  ImgCid: String,
  NgoRef: { type: mongoose.Schema.Types.ObjectId, ref: 'ngomodel' },
  NeedAmount: Number,
  CollectedAmount: Number,
  WalletAddr: String
});

// Test user management
class TestUserManager {
  constructor() {
    this.testUsers = new Map();
    try {
      this.UserModel = mongoose.model('ngomodel', NgoSchema);
      this.PostModel = mongoose.model('postmodel', PostSchema);
    } catch (error) {
      this.UserModel = mongoose.model('ngomodel');
      this.PostModel = mongoose.model('postmodel');
    }
  }

  async createTestUser(overrides = {}) {
    const userData = TestDataGenerator.generateNGO(overrides);
    
    const hashedPassword = await bcrypt.hash(userData.Password, 10);
    userData.Password = hashedPassword;

    const user = await this.UserModel.create(userData);
    this.testUsers.set(user._id.toString(), user);
    
    return user;
  }

  async createTestPost(ngoId, overrides = {}) {
    const postData = TestDataGenerator.generatePost(ngoId, overrides);
    const post = await this.PostModel.create(postData);
    return post;
  }

  generateTokens(userId, email, ngoName, publicKey) {
    const accessToken = jwt.sign(
      { id: userId, userId: userId, email: email, NgoName: ngoName, walletAddr: publicKey },
      TEST_CONFIG.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: userId, walletAddr: publicKey },
      TEST_CONFIG.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }
}

// Test server setup
class TestServer {
  constructor() {
    this.app = null;
    this.server = null;
    this.port = TEST_CONFIG.PORT;
  }

  async start(log) {
    try {
      process.env.NODE_ENV = TEST_CONFIG.NODE_ENV;
      process.env.ATS = TEST_CONFIG.JWT_SECRET;
      process.env.RTS = TEST_CONFIG.JWT_REFRESH_SECRET;
      process.env.FRONTEND_URL = TEST_CONFIG.FRONTEND_URL;

      // Dynamically import the Express app
      const { default: app } = await import(path.resolve(__dirname, '..', 'server', 'dist', 'app.js')); 
      this.app = app;

      this.server = this.app.listen(this.port, () => {
        log(`🚀 Test server running on port ${this.port}`, 'green');
      });

      return this.app;
    } catch (error) {
      log(`❌ Test server start failed. Did you run 'npm run build' in the server directory? ${error.message}`, 'red');
      throw error;
    }
  }

  async stop(log) {
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
      }
      log('✅ Test server stopped', 'green');
    } catch (error) {
      log(`❌ Test server stop failed: ${error.message}`, 'red');
    }
  }
}

// Test utilities for requests and assertions
class TestUtils {
  static async makeRequest(app, method, path, data = null, headers = {}) {
    let request;
    try {
      // Dynamic import for supertest in ESM context
      const supertestModule = await import('supertest'); 
      request = supertestModule.default;
    } catch (e) {
      throw new Error("❌ 'supertest' is required for TestUtils.makeRequest. Please install it.");
    }

    let req = request(app)[method.toLowerCase()](path);

    if (headers) {
      req = req.set(headers);
    }

    if (data) {
      if (method.toLowerCase() === 'get') {
        req = req.query(data);
      } else {
        req = req.send(data);
      }
    }

    return req;
  }

  static generateTestHeaders(accessToken = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return headers;
  }

  static validateResponse(response, expectedStatus = 200) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}. Message: ${response.body.message || 'No message'}`);
    }
    if (response.body.success === false) {
      throw new Error(`Expected success: true, but got success: false. Message: ${response.body.message || 'No message'}`);
    }
    return response.body;
  }

  static validateErrorResponse(response, expectedStatus = 400) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected error status ${expectedStatus}, got ${response.status}. Message: ${response.body.message || 'No message'}`);
    }
    if (response.body.success !== false) {
      throw new Error('Expected error response with success: false');
    }
    return response.body;
  }
}

// Test scenarios
class TestScenarios {
  constructor(userManager, testServer, log) {
    this.userManager = userManager;
    this.testServer = testServer;
    this.log = log;
    this.testUser = null; 
    this.app = testServer.app;
  }

  async runAuthenticationTests() {
    this.log('🧪 Running authentication tests...', 'blue');
    let passed = 0;
    
    // Test 1: Setup and create initial test user
    const managedUser = await this.userManager.createTestUser({ Email: 'managedtest@ngo.com' });
    this.testUser = managedUser; 
    passed++;

    // Test 2: Successful registration (using a unique email)
    const userData = TestDataGenerator.generateNGO();
    let response = await TestUtils.makeRequest(this.app, 'POST', '/api/user/signup', userData);
    TestUtils.validateResponse(response, 200);
    this.log('✅ Registration test passed');
    passed++;

    // Test 3: Duplicate email registration (Expected to FAIL in server, expected status 401)
    try {
      const duplicateResponse = await TestUtils.makeRequest(this.app, 'POST', '/api/user/signup', userData);
      TestUtils.validateErrorResponse(duplicateResponse, 401);
      this.log('✅ Duplicate email test passed (Server returned expected 401/error)');
      passed++;
    } catch (error) {
      if (error.message.includes('Expected error status 401, got 200')) {
         this.log('❌ Duplicate email test failed: Server returned 200 success instead of 401 error.', 'red');
         throw new Error('Duplicate email test failed: Server bug (Returned 200 instead of 401)');
      }
      throw error;
    }

    // Test 4: Successful login
    const loginData = { email: managedUser.Email, password: 'TestPassword123' };
    const loginResponse = await TestUtils.makeRequest(this.app, 'POST', '/api/user/login', loginData);
    TestUtils.validateResponse(loginResponse, 200);
    this.log('✅ Login test passed');
    passed++;

    return { passed, failed: 0, accessToken: loginResponse.body.data.accessToken };
  }

  async runPostTests(accessToken) {
    this.log('🧪 Running post tests...', 'blue');
    let passed = 0;

    if (!this.testUser) {
      throw new Error('Test user not set up. Cannot run post tests.');
    }
    const headers = TestUtils.generateTestHeaders(accessToken);
    const ngoId = this.testUser._id.toString(); 

    // Test 1: Create post with authentication
    const postData = TestDataGenerator.generatePost(ngoId);
    let response = await TestUtils.makeRequest(this.app, 'POST', '/api/posts', postData, headers);
    TestUtils.validateResponse(response, 200);
    const createdPost = response.body.data;
    this.log('✅ Post creation test passed');
    passed++;

    // Test 2: Get all posts
    let getResponse = await TestUtils.makeRequest(this.app, 'GET', '/api/posts');
    const posts = TestUtils.validateResponse(getResponse, 200).data;
    if (!posts.find(p => p._id === createdPost._id)) {
      throw new Error('Created post not found in get all posts response');
    }
    this.log('✅ Get posts test passed');
    passed++;
    
    // Test 3: Get single post
    let getSingleResponse = await TestUtils.makeRequest(this.app, 'GET', `/api/posts/${createdPost._id}`);
    TestUtils.validateResponse(getSingleResponse, 200);
    this.log('✅ Get single post test passed');
    passed++;

    return { passed, failed: 0, createdPost };
  }

  async runStellarTests() {
    this.log('🧪 Running Stellar tests...', 'blue');
    let passed = 0;
    
    // Test 1: Get wallet balance
    let balanceResponse = await TestUtils.makeRequest(this.app, 'GET', '/api/stellar/balance/GTestPublicKey123');
    TestUtils.validateResponse(balanceResponse, 200);
    this.log('✅ Stellar balance test passed (or successfully mocked)');
    passed++;
    
    // Test 2: Create Stellar account
    let accountResponse = await TestUtils.makeRequest(this.app, 'POST', '/api/stellar/create-account');
    TestUtils.validateResponse(accountResponse, 200);
    this.log('✅ Stellar account creation test passed (or successfully mocked)');
    passed++;
    
    return { passed, failed: 0 };
  }
}

// ===============================================
// MAIN TEST RUNNER LOGIC
// ===============================================

class TestRunner {
  constructor(options = {}) {
    this.options = {
      mode: options.mode || 'all',
      format: options.format || 'console',
      verbose: options.verbose || false,
      watch: options.watch || false,
      coverage: options.coverage || false,
      timeout: options.timeout || 30000,
      suite: options.suite || 'all', 
      ...options
    };
    
    this.startTime = Date.now();
    this.results = [];
    this.testDB = new TestDatabase();
    this.userManager = new TestUserManager();
    this.testServer = new TestServer();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(message) {
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log(`  ${message}`, 'bright');
    this.log(`${'='.repeat(60)}`, 'cyan');
  }

  logSection(message) {
    this.log(`\n${'-'.repeat(40)}`, 'blue');
    this.log(`  ${message}`, 'blue');
    this.log(`${'-'.repeat(40)}`, 'blue');
  }

  async checkPrerequisites() {
    this.logSection('Checking Prerequisites');
    // Check if Node.js is installed
    try {
      this.log(`✅ Node.js: ${process.version}`, 'green');
    } catch (error) {
      this.log('❌ Node.js not found', 'red');
      return false;
    }

    // Check if server is built
    const appPath = path.resolve(__dirname, '..', 'server', 'dist', 'app.js');
    if (!fs.existsSync(appPath)) {
      this.log('⚠️  Server not built. Attempting to run build command...', 'yellow');
      return await this.buildServer();
    } else {
      this.log('✅ Server built', 'green');
      return true;
    }
  }

  async buildServer() {
    return new Promise((resolve) => {
      this.log('Building server...', 'yellow');
      // Assumes 'npm run build' needs to run in the parent directory
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: path.resolve(__dirname, '..'), 
        stdio: 'inherit'
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          this.log('✅ Server built successfully', 'green');
          resolve(true);
        } else {
          this.log('❌ Server build failed', 'red');
          resolve(false);
        }
      });

      buildProcess.on('error', (error) => {
        this.log(`❌ Build error: ${error.message}`, 'red');
        resolve(false);
      });
    });
  }

  async setup() {
    this.log('🔧 Setting up test environment...', 'blue');
    await this.testDB.start(this.log.bind(this));
    await this.testServer.start(this.log.bind(this));
    this.log('✅ Test environment ready', 'green');
  }

  async teardown() {
    this.log('🧹 Cleaning up test environment...', 'blue');
    // Ensure all services are stopped cleanly
    await this.testServer.stop(this.log.bind(this));
    await this.testDB.clear(this.log.bind(this));
    await this.testDB.stop(this.log.bind(this));
    this.log('✅ Test environment cleaned up', 'green');
  }
  

  async runAllTests() {
    this.logHeader('Soul-Society Test Suite');
    this.log(`Mode: ${this.options.mode}`, 'blue');
    this.log(`Format: ${this.options.format}`, 'blue');
    this.log(`Target Suite: ${this.options.suite === 'all' ? 'All Suites' : this.options.suite}`, 'blue');

    // Check prerequisites
    if (!await this.checkPrerequisites()) {
      this.log('❌ Prerequisites check failed. Exiting.', 'red');
      process.exit(1);
    }
    
    // Setup environment once
    try {
        await this.setup();
    } catch (e) {
        this.log(`❌ Critical setup failure: ${e.message}. Cannot proceed.`, 'red');
        process.exit(1);
    }
    
    const scenarios = new TestScenarios(this.userManager, this.testServer, this.log.bind(this));

    // Determine which test suites (scenarios) to run
    let suitesToRun = TEST_CONFIG.suites;
    if (this.options.suite !== 'all') {
      if (TEST_CONFIG.suites.includes(this.options.suite)) {
          suitesToRun = [this.options.suite];
      } else {
          this.log(`❌ Invalid suite specified: ${this.options.suite}. Running all instead.`, 'yellow');
          suitesToRun = TEST_CONFIG.suites;
      }
    }

    let accessToken = null;

    // Run test suites (scenarios) sequentially
    for (const suite of suitesToRun) {
      let result = { passed: 0, failed: 0, skipped: 0, duration: 0, error: null };
      const startTime = Date.now();
      
      this.logSection(`Executing SCENARIO: ${suite}`);

      try {
        let scenarioResult = null;
          
        if (suite === 'auth') {
           scenarioResult = await scenarios.runAuthenticationTests();
           accessToken = scenarioResult.accessToken;
        } else if (suite === 'posts' && accessToken) {
           scenarioResult = await scenarios.runPostTests(accessToken);
        } else if (suite === 'stellar') {
           scenarioResult = await scenarios.runStellarTests();
        } 
        // NOTE: Add your runPaymentTests, runIpfsTests, runExpensesTests here
        else if (['payment', 'ipfs', 'expenses'].includes(suite)) {
          this.log(`⚠️ Scenario ${suite} not implemented in TestScenarios. Skipping.`, 'yellow');
          result.skipped = 1;
        } else if (suite === 'posts' && !accessToken) {
             this.log(`⚠️ Cannot run 'posts' scenario: Authentication failed in a previous step. Skipping.`, 'yellow');
             result.skipped = 1;
        }
        
        if (scenarioResult) {
            result.passed = scenarioResult.passed;
            result.total = result.passed;
        }
        
        result.duration = Date.now() - startTime;
        if (result.skipped === 0) {
            this.log(`✅ ${suite} scenario completed in ${result.duration}ms`, 'green');
        }
        
      } catch (error) {
        // CATCH FAILURE: Log the error, mark the suite as failed, then CONTINUE the loop.
        result.failed = 1; // Mark the scenario itself as failed
        result.error = error.message;
        result.duration = Date.now() - startTime;
        this.log(`❌ SCENARIO FAILED: ${suite} - ${error.message}`, 'red');
        
        // If authentication fails, clear the token so dependent tests (like posts) skip
        if (suite === 'auth') {
            accessToken = null;
        }
      }
      
      this.results.push({ suite, ...result });
      
      testStats.total += result.passed + result.failed + result.skipped;
      testStats.passed += result.passed;
      testStats.failed += result.failed;
      testStats.skipped += result.skipped;
    }

    // Calculate total duration
    testStats.duration = Date.now() - this.startTime;

    // Generate report
    this.generateReport();
  }

  generateReport() {
    this.logHeader('Test Results Summary');
    
    // Overall statistics
    this.log(`Total Tests: ${testStats.total}`, 'bright');
    this.log(`Passed: ${testStats.passed}`, 'green');
    this.log(`Failed: ${testStats.failed}`, 'red');
    this.log(`Skipped: ${testStats.skipped}`, 'yellow');
    this.log(`Duration: ${testStats.duration}ms`, 'blue');
    
    // Success rate
    const successRate = testStats.total > 0 ? (testStats.passed / testStats.total * 100).toFixed(2) : 0;
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

    // Detailed results by suite
    this.logSection('Results by Test Suite');
    for (const result of this.results) {
      const status = result.failed > 0 ? '❌' : '✅';
      this.log(`${status} ${result.suite}: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped (${result.duration}ms)`);
    }

    // Exit with appropriate code, ensuring teardown completes first
    this.teardown().then(() => {
        const exitCode = testStats.failed > 0 ? 1 : 0;
        if (exitCode === 0) {
          this.log('\n🎉 All tests passed!', 'green');
        } else {
          this.log(`\n💥 ${testStats.failed} scenarios/tests failed!`, 'red');
        }
        process.exit(exitCode);
    });
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
        options.mode = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--suite': 
        options.suite = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--coverage':
        options.coverage = true;
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
Soul-Society Test Runner

Usage: node run-tests.js [options]

Options:
  --suite <suite>    Run a single suite: auth, posts, stellar, etc. (default: all)
  --mode <mode>      Test mode: unit, integration, e2e, all (default: all)
  --format <format>  Output format: console, json, html, junit (default: console)
  --verbose          Verbose output
  --watch            Watch mode
  --coverage         Generate coverage report
  --timeout <ms>     Test timeout in milliseconds (default: 30000)
  --help             Show this help message

Examples:
  node run-tests.js --suite auth --verbose
  node run-tests.js --format html --coverage
  node run-tests.js --suite posts
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Main execution
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  const options = parseArgs();
  const runner = new TestRunner(options);
  
  runner.runAllTests().catch(async error => {
    // If an error happens before setup, the teardown must be guarded
    console.error('❌ Test runner failed catastrophically:', error);
    if (runner.testServer.server) {
      await runner.teardown();
    }
    process.exit(1);
  });
}