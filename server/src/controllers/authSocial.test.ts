import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import * as auth from './auth.controller';
import User from '../models/User';
import { createUser } from '../test/helpers';

interface MockRes {
  cookie: ReturnType<typeof vi.fn>;
  redirect: ReturnType<typeof vi.fn>;
}

const callSocialAuth = async (provider: 'google' | 'facebook', profile: unknown) => {
  const res: MockRes = { cookie: vi.fn(), redirect: vi.fn() };
  const handler = auth.socialAuthCallback(provider) as unknown as (
    req: Request,
    _res: Response,
    next: (err?: unknown) => void,
  ) => void;
  handler({ user: profile } as unknown as Request, res as unknown as Response, () => undefined);
  await vi.waitFor(() => {
    expect(res.redirect).toHaveBeenCalledTimes(1);
  });
  return res;
};

const googleProfile = {
  id: 'google-123',
  displayName: 'Gina Google',
  emails: [{ value: 'gina@example.com' }],
  photos: [{ value: 'https://example.com/gina.jpg' }],
};

describe('socialAuthCallback', () => {
  it('creates a new user for an unknown google profile and redirects with a token', async () => {
    const res = await callSocialAuth('google', googleProfile);
    const user = await User.findOne({ email: 'gina@example.com' }).lean();
    expect(user).not.toBeNull();
    expect(user).toMatchObject({ provider: 'google', providerId: 'google-123', isVerified: true, avatar: 'https://example.com/gina.jpg' });
    const redirectUrl = res.redirect.mock.calls[0][0] as string;
    expect(redirectUrl).toContain('/auth/callback?accessToken=');
    expect(res.cookie).toHaveBeenCalled();
  });

  it('reuses an existing user with the same email', async () => {
    const existing = await createUser({ email: 'gina@example.com' });
    await callSocialAuth('google', googleProfile);
    const users = await User.find({ email: 'gina@example.com' }).lean();
    expect(users).toHaveLength(1);
    expect(String(users[0]._id)).toBe(String(existing._id));
  });

  it('falls back to a synthetic email for providers without one (facebook)', async () => {
    const res = await callSocialAuth('facebook', {
      id: 'fb-456',
      displayName: 'Fadi Facebook',
      emails: [],
      photos: [],
    });
    const user = await User.findOne({ email: 'fb-456@facebook.local' }).lean();
    expect(user).not.toBeNull();
    expect(user).toMatchObject({ provider: 'facebook', providerId: 'fb-456' });
    expect(res.redirect.mock.calls[0][0] as string).toContain('/auth/callback?accessToken=');
  });
});
