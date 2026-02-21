/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': ['ts-jest', { useESM: false }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@middy)/)',
  ],
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/types/**',
  ],
};
