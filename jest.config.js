module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: process.env.APP_VARIANT
    ? []
    : ['<rootDir>/tests/variants/'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/express-session-augment.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json'
      }
    ]
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts']
};
