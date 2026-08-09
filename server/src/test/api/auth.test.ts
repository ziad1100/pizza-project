import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as usersRepo from '../../db/users';
import { api, bearer, createUser, seedRoles, toId } from '../helpers';

vi.mock('../../middlewares/rateLimiter', () => ({
  authLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const AUTH = '/api/v1/auth';

const register = () =>
  api.post(`${AUTH}/register`).send({
    fullName: 'Fresh User',
    email: 'fresh@example.com',
    phone: '01012345678',
    password: 'Pizza123!',
  });

describe('register', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('creates a user, returns a token and sets auth cookies', async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('fresh@example.com');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.accessToken).toBeTruthy();
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.join(' | ')).toContain('refreshToken=');
    expect(cookies.join(' | ')).toContain('accessToken=');
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('rejects a duplicate email with 409', async () => {
    await register();
    const res = await register();
    expect(res.status).toBe(409);
  });

  it('rejects a weak password with 422', async () => {
    const res = await api
      .post(`${AUTH}/register`)
      .send({ fullName: 'Weak', email: 'weak@example.com', password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('at least 8 characters');
  });

  it('rejects an invalid email with 422', async () => {
    const res = await api
      .post(`${AUTH}/register`)
      .send({ fullName: 'Bad', email: 'not-an-email', password: 'Pizza123!' });
    expect(res.status).toBe(422);
  });
});

describe('login', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('logs in with valid credentials and returns user + permissions', async () => {
    await createUser({ email: 'customer@pizzahouse.test' });
    const res = await api
      .post(`${AUTH}/login`)
      .send({ email: 'customer@pizzahouse.test', password: 'Pizza123!' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('customer@pizzahouse.test');
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user.permissions.orders).toEqual([]);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects a wrong password with 401', async () => {
    await createUser({ email: 'customer@pizzahouse.test' });
    const res = await api
      .post(`${AUTH}/login`)
      .send({ email: 'customer@pizzahouse.test', password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with 401', async () => {
    const res = await api
      .post(`${AUTH}/login`)
      .send({ email: 'nobody@example.com', password: 'Pizza123!' });
    expect(res.status).toBe(401);
  });

  it('rejects a deactivated account with 403', async () => {
    await createUser({ email: 'locked@pizzahouse.test', isActive: false });
    const res = await api
      .post(`${AUTH}/login`)
      .send({ email: 'locked@pizzahouse.test', password: 'Pizza123!' });
    expect(res.status).toBe(403);
  });
});

describe('me', () => {
  beforeEach(async () => {
    await seedRoles();
  });

it('returns the profile with a valid token', async () => {
    const user = await createUser();
    const res = await api.get(`${AUTH}/me`).set(bearer(user.id));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.permissions).toMatchObject({});
  });

  it('returns 401 without a token', async () => {
    const res = await api.get(`${AUTH}/me`);
    expect(res.status).toBe(401);
  });
});

describe('refresh', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  const login = async () => {
    await createUser({ email: 'session@pizzahouse.test' });
    const loginRes = await api
      .post(`${AUTH}/login`)
      .send({ email: 'session@pizzahouse.test', password: 'Pizza123!' });
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='))!.split(';')[0];
    return refreshCookie;
  };

  it('issues a new access token and rotates the refresh token', async () => {
    const oldCookie = await login();
    await new Promise((r) => setTimeout(r, 1100));
    const first = await api.post(`${AUTH}/refresh`).set('Cookie', oldCookie);
    expect(first.status).toBe(200);
    expect(first.body.data.accessToken).toBeTruthy();
    const user = await usersRepo.getByEmail('session@pizzahouse.test');
    expect(user?.refreshToken).not.toBe(oldCookie.split('=')[1]);
  });

  it('detects reuse of an old refresh token and forces re-login', async () => {
    const oldCookie = await login();
    await new Promise((r) => setTimeout(r, 1100));
    expect((await api.post(`${AUTH}/refresh`).set('Cookie', oldCookie)).status).toBe(200);
    const reuse = await api.post(`${AUTH}/refresh`).set('Cookie', oldCookie);
    expect(reuse.status).toBe(401);
    expect(reuse.body.message).toContain('reused');
  });

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await api.post(`${AUTH}/refresh`);
    expect(res.status).toBe(401);
  });
});

describe('logout', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('clears the auth cookies', async () => {
    const user = await createUser();
    const res = await api.post(`${AUTH}/logout`).set(bearer(toId(user.id)));
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    const cleared = cookies.filter((c) => /refreshToken=;|accessToken=;/.test(c));
    expect(cleared.length).toBe(2);
  });
});

describe('email verification', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('verifies an email with a valid token, then rejects reuse', async () => {
    await register();
    const user = await usersRepo.getByEmail('fresh@example.com');
    const ok = await api.get(`${AUTH}/verify-email`).query({ token: user!.emailVerifyToken });
    expect(ok.status).toBe(200);
    const again = await api.get(`${AUTH}/verify-email`).query({ token: user!.emailVerifyToken });
    expect(again.status).toBe(400);
    const after = await usersRepo.getById(user!.id);
    expect(after?.isVerified).toBe(true);
  });

  it('rejects an invalid token', async () => {
    const res = await api.get(`${AUTH}/verify-email`).query({ token: 'bogus' });
    expect(res.status).toBe(400);
  });
});

describe('forgot & reset password', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('responds identically for known and unknown emails (no enumeration)', async () => {
    await createUser({ email: 'known@pizzahouse.test' });
    const known = await api.post(`${AUTH}/forgot-password`).send({ email: 'known@pizzahouse.test' });
    const unknown = await api.post(`${AUTH}/forgot-password`).send({ email: 'ghost@pizzahouse.test' });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('sets a reset token for the account', async () => {
    await createUser({ email: 'known@pizzahouse.test' });
    await api.post(`${AUTH}/forgot-password`).send({ email: 'known@pizzahouse.test' });
    const user = await usersRepo.getByEmail('known@pizzahouse.test');
    expect(user?.resetToken).toBeTruthy();
  });

  it('returns a 6-digit OTP code when SMTP is unconfigured', async () => {
    await createUser({ email: 'otp@pizzahouse.test' });
    const res = await api.post(`${AUTH}/forgot-password`).send({ email: 'otp@pizzahouse.test' });
    expect(res.status).toBe(200);
    expect(res.body.data.code).toMatch(/^\d{6}$/);
    expect(res.body.data.link).toContain('reset-password?token=');
  });

  it('resets the password via the emailed OTP code', async () => {
    await createUser({ email: 'otpflow@pizzahouse.test' });
    const sent = await api.post(`${AUTH}/forgot-password`).send({ email: 'otpflow@pizzahouse.test' });
    const code = sent.body.data.code as string;
    const reset = await api.post(`${AUTH}/reset-password`).send({ token: code, password: 'OtpChange99' });
    expect(reset.status).toBe(200);
    const login = await api
      .post(`${AUTH}/login`)
      .send({ email: 'otpflow@pizzahouse.test', password: 'OtpChange99' });
    expect(login.status).toBe(200);
  });

  it('resets the password and allows login with the new one', async () => {
    await createUser({ email: 'resetme@pizzahouse.test', resetToken: 'reset-token-123', resetTokenExpires: new Date(Date.now() + 3600_000) });
    const res = await api
      .post(`${AUTH}/reset-password`)
      .send({ token: 'reset-token-123', password: 'BrandNew99' });
    expect(res.status).toBe(200);
    const after = await api
      .post(`${AUTH}/login`)
      .send({ email: 'resetme@pizzahouse.test', password: 'BrandNew99' });
    expect(after.status).toBe(200);
  });

  it('rejects an invalid or expired reset token', async () => {
    await createUser({ email: 'resetme@pizzahouse.test', resetToken: 'tok', resetTokenExpires: new Date(Date.now() - 1000) });
    const res = await api
      .post(`${AUTH}/reset-password`)
      .send({ token: 'tok', password: 'Changed99' });
    expect(res.status).toBe(400);
  });
});

describe('change password', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('changes the password and allows login with the new one', async () => {
    const user = await createUser({ email: 'changeme@pizzahouse.test' });
    const auth = bearer(toId(user.id));
    const res = await api.post(`${AUTH}/change-password`).set(auth).send({ currentPassword: 'Pizza123!', newPassword: 'Rotated123' });
    expect(res.status).toBe(200);
    const login = await api.post(`${AUTH}/login`).send({ email: 'changeme@pizzahouse.test', password: 'Rotated123' });
    expect(login.status).toBe(200);
  });

  it('rejects a wrong current password', async () => {
    const user = await createUser({ email: 'neweme@pizzahouse.test' });
    const res = await api
      .post(`${AUTH}/change-password`)
      .set(bearer(toId(user.id)))
      .send({ currentPassword: 'WrongPass1', newPassword: 'Rotated123' });
    expect(res.status).toBe(400);
  });
});