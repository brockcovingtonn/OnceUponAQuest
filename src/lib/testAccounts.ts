/**
 * Shared tester accounts (user1@ … user4@onceuponaquest.com). They sign in
 * with one fixed 6-digit test code instead of an emailed one: the sign-in
 * screen skips sending an email and checks the code directly. The code is set
 * by scripts/create-test-accounts.mjs and is never stored in the app.
 */
const TEST_ACCOUNT = /^user[1-4]@onceuponaquest\.com$/;

export function isTestAccount(email: string): boolean {
  return TEST_ACCOUNT.test(email.trim().toLowerCase());
}
