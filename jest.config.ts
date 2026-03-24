import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['ts', 'js'],
  roots: ['.', 'test', '<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/node_modules'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/entity',
    '<rootDir>/src/config',
    '<rootDir>/src/module',
    '<rootDir>/src/repository',
    '<rootDir>/src/main.ts',
    '<rootDir>/jest.config.ts',
  ],
  collectCoverageFrom: ['**/*.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
