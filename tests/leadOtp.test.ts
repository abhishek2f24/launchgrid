import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CODE_TTL_MS,
  accountRef,
  generateCode,
  issueToken,
  leadSecret,
  normaliseEmail,
  unsubscribeSig,
  verifyToken,
  verifyUnsubscribeSig,
} from '../src/lib/apps/leadOtp.ts'

const SECRET = 'test-secret-do-not-use'
const EMAIL = 'someone@example.com'

test('normaliseEmail lower-cases, trims and rejects junk', () => {
  assert.equal(normaliseEmail('  Someone@Example.COM '), EMAIL)
  assert.equal(normaliseEmail('not-an-email'), null)
  assert.equal(normaliseEmail(42), null)
})

test('codes are six digits, zero-padded', () => {
  for (let i = 0; i < 200; i++) assert.match(generateCode(), /^\d{6}$/)
})

test('the right code verifies', () => {
  const { token } = issueToken(SECRET, EMAIL, '012345', 1_000)
  assert.equal(verifyToken(SECRET, token, EMAIL, '012345', 2_000), 'ok')
})

test('a wrong code does not', () => {
  const { token } = issueToken(SECRET, EMAIL, '012345', 1_000)
  assert.equal(verifyToken(SECRET, token, EMAIL, '012346', 2_000), 'mismatch')
})

test('a code expires after the TTL', () => {
  const { token } = issueToken(SECRET, EMAIL, '012345', 1_000)
  assert.equal(verifyToken(SECRET, token, EMAIL, '012345', 1_000 + CODE_TTL_MS + 1), 'expired')
})

test('a token cannot be used for a different email', () => {
  const { token } = issueToken(SECRET, EMAIL, '012345', 1_000)
  assert.equal(verifyToken(SECRET, token, 'other@example.com', '012345', 2_000), 'malformed')
})

test('a token signed with another secret fails', () => {
  const { token } = issueToken('another-secret', EMAIL, '012345', 1_000)
  assert.equal(verifyToken(SECRET, token, EMAIL, '012345', 2_000), 'mismatch')
})

test('the token does not contain the code', () => {
  const { token } = issueToken(SECRET, EMAIL, '987654', 1_000)
  const payload = Buffer.from(token.split('.')[0], 'base64url').toString('utf8')
  assert.ok(!payload.includes('987654'))
})

test('malformed input is rejected, not thrown', () => {
  assert.equal(verifyToken(SECRET, 'garbage', EMAIL, '123456'), 'malformed')
  assert.equal(verifyToken(SECRET, undefined, EMAIL, '123456'), 'malformed')
  assert.equal(verifyToken(SECRET, 'a.b', EMAIL, '12345'), 'malformed')
})

test('accountRef is stable, opaque and fits obfuscatedAccountId', () => {
  const ref = accountRef(SECRET, EMAIL)
  assert.equal(ref, accountRef(SECRET, EMAIL))
  assert.ok(ref.length <= 64)
  assert.ok(!ref.includes('someone'))
})

test('unsubscribe signatures verify only for their email', () => {
  const sig = unsubscribeSig(SECRET, EMAIL)
  assert.ok(verifyUnsubscribeSig(SECRET, EMAIL, sig))
  assert.ok(!verifyUnsubscribeSig(SECRET, 'other@example.com', sig))
  assert.ok(!verifyUnsubscribeSig(SECRET, EMAIL, 'nope'))
})

test('leadSecret prefers the dedicated secret', () => {
  assert.equal(leadSecret({ APPLOCK_LEAD_SECRET: 'a', ENCRYPTION_KEY: 'b' }), 'a')
  assert.equal(leadSecret({ ENCRYPTION_KEY: 'b' }), 'b')
  assert.equal(leadSecret({}), null)
})
