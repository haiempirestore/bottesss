import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Setup environment before importing security module
process.env.JWT_SECRET = 'cyberpunk_jwt_ultra_secure_secret_key_change_me_32chars';

// Dynamic import after setting environment variable
const { signUser, signAdmin, verifyTelegramInitData } = await import('../dist/security.js');

test('signUser generates valid JWT string', () => {
  const token = signUser('test-user-id');
  assert.equal(typeof token, 'string');
  assert.ok(token.split('.').length === 3);
});

test('signAdmin generates valid JWT string', () => {
  const token = signAdmin('test-admin-id');
  assert.equal(typeof token, 'string');
  assert.ok(token.split('.').length === 3);
});

test('verifyTelegramInitData validates signature correctly', () => {
  const botToken = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_test_token';
  const now = Math.floor(Date.now() / 1000);
  const data = {
    auth_date: String(now),
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    user: JSON.stringify({ id: 123456, first_name: 'Hai', username: 'hai1110' })
  };

  const dataCheckString = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const initData = new URLSearchParams({ ...data, hash }).toString();
  const result = verifyTelegramInitData(initData, botToken);

  assert.equal(result.query_id, 'AAHdF6IQAAAAAN0XohDhrOrc');
});

test('verifyTelegramInitData rejects tampered data', () => {
  const botToken = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_test_token';
  const initData = 'auth_date=1600000000&query_id=fake&hash=0000000000000000000000000000000000000000000000000000000000000000';
  assert.throws(() => {
    verifyTelegramInitData(initData, botToken);
  });
});
