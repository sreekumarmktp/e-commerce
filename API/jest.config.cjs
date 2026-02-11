/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid')
  }
};

