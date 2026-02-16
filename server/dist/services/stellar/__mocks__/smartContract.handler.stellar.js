import { jest } from '@jest/globals';
export const registerMission = jest.fn().mockResolvedValue({ hash: 'MOCK_TX_HASH' });
export const sealMissionProof = jest.fn();
export const saveContractWithWallet = jest.fn();
export const getLatestData = jest.fn();
export const server = {}; // Mock server object if imported
//# sourceMappingURL=smartContract.handler.stellar.js.map