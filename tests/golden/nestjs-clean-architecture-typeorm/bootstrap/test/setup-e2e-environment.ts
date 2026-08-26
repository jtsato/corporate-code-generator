/**
 * Selects the environment the end-to-end suite boots against.
 *
 * The suite starts the real `AppModule`, which picks its database from
 * `NODE_ENV`. Without this the suite would load `.env.development` and try to
 * reach the PostgreSQL a developer machine is not required to be running;
 * `.env.test` points at the in-process engine instead, so `npm run test:e2e`
 * needs nothing provisioned.
 *
 * This runs as a Jest `setupFiles` entry, which executes before the test file is
 * imported and therefore before `AppModule` reads anything. An assignment inside
 * the test file would be too late: its imports are evaluated first.
 *
 * An explicitly provided NODE_ENV is respected, so the same suite can be pointed
 * at another environment deliberately.
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
