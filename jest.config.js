import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ["**/**/*.test.ts"],
  forceExit: true,
  // clearMocks: true
  moduleNameMapper: {
    "^bcrypt$": "<rootDir>/src/tests/mocks/bcrypt.mock.ts",
  },
};