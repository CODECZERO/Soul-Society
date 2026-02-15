const { TestEnvironment } = require('./test-utils');

let testEnv;

beforeAll(async () => {
  testEnv = await new TestEnvironment().start();
  global.testEnv = testEnv;
});

afterAll(async () => {
  await testEnv.stop();
});

beforeEach(async () => {
  await testEnv.testDB.clear();
});
