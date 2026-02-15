const { faker } = require('@faker-js/faker');

const createTestUser = (overrides = {}) => ({
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

module.exports = { createTestUser };
