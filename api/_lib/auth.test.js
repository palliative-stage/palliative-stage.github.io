const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

describe('password hashing', () => {
  let auth;

  before(() => {
    process.env.AUTH_SECRET = 'test-secret';
    auth = require('./auth');
  });

  it('accepts the password that was hashed', () => {
    const stored = auth.hashPassword('correct-horse');
    assert.equal(auth.verifyPassword('correct-horse', stored), true);
  });

  it('rejects a different password', () => {
    const stored = auth.hashPassword('correct-horse');
    assert.equal(auth.verifyPassword('other-horse', stored), false);
  });

  it('rejects a tampered hash', () => {
    assert.equal(auth.verifyPassword('correct-horse', 'scrypt$1$2$3$aaaa$bbbb'), false);
  });
});

describe('cookies and emails', () => {
  let auth;

  before(() => {
    process.env.AUTH_SECRET = 'test-secret';
    auth = require('./auth');
  });

  it('reads the session cookie', () => {
    const req = { headers: { cookie: 'other=1; ps_session=abc%2Bdef; theme=light' } };
    assert.equal(auth.readCookie(req, 'ps_session'), 'abc+def');
  });

  it('normalizes email addresses', () => {
    assert.equal(auth.normalizeEmail('  TalmonF@Gmail.com '), 'talmonf@gmail.com');
    assert.equal(auth.normalizeEmail('not-an-email'), null);
  });

  it('requires a password of at least 10 characters', () => {
    assert.equal(auth.isAcceptablePassword('short'), false);
    assert.equal(auth.isAcceptablePassword('long-enough'), true);
  });

  it('normalizes profile names and occupations', () => {
    assert.equal(auth.normalizePersonName('  דנה   לוי '), 'דנה לוי');
    assert.equal(auth.normalizePersonName('   '), null);
    assert.equal(auth.normalizePersonName('a'.repeat(81)), null);
    assert.equal(auth.normalizeOccupation('nurse'), 'nurse');
    assert.equal(auth.normalizeOccupation('teacher'), null);
  });

  it('includes profile fields on the public user', () => {
    assert.deepEqual(
      auth.toPublicUser({
        email: 'a@b.com',
        role: 'user',
        must_change_password: 0,
        first_name: 'דנה',
        last_name: 'לוי',
        occupation: 'nurse',
      }),
      {
        email: 'a@b.com',
        role: 'user',
        mustChangePassword: false,
        firstName: 'דנה',
        lastName: 'לוי',
        occupation: 'nurse',
      }
    );
  });
});
