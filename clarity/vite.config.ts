/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import GithubActionsReporter from "vitest-github-actions-reporter";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 300_000,
    hookTimeout: 150_000,
    teardownTimeout: 15_000,
    reporters: process.env.GITHUB_ACTIONS
      ? ["default", new GithubActionsReporter()]
      : "default",
    // minThreads: 2,
    // maxThreads: 4,
    // silent: true,
    // maxConcurrency: 5,
    // slowTestThreshold: 120_000;
  },
});
