const mockStellarSdk = {
  Server: jest.fn().mockImplementation(() => ({
    loadAccount: jest.fn().mockResolvedValue({}),
    submitTransaction: jest.fn().mockResolvedValue({
      hash: 'mock-transaction-hash',
      success: true
    })
  })),
  Keypair: {
    fromSecret: jest.fn().mockReturnValue({
      publicKey: jest.fn().mockReturnValue('mock-public-key')
    })
  },
  TransactionBuilder: {
    fromXDR: jest.fn().mockReturnValue({
      toEnvelope: jest.fn().mockReturnValue({ toXDR: jest.fn() })
    })
  }
};

jest.mock('stellar-sdk', () => mockStellarSdk);

module.exports = { mockStellarSdk };
