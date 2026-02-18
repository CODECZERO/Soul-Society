import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: 'tsconfig.json',
            },
        ],
    },
    testMatch: [
        '<rootDir>/src/__tests__/**/*.test.ts',
    ],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
};

export default config;
