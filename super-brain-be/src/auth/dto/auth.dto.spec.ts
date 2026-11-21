import { SigninSchema, SignupSchema } from './auth.dto';

describe('Auth DTOs', () => {
  it('normalises a valid signup', () => {
    const r = SignupSchema.parse({ username: 'ada_l', email: ' Ada@Example.COM ', password: 'longenough' });
    expect(r.email).toBe('ada@example.com');
  });

  it.each([
    [{ username: 'ab', email: 'a@b.co', password: 'longenough' }, 'short username'],
    [{ username: 'bad name!', email: 'a@b.co', password: 'longenough' }, 'invalid chars'],
    [{ username: 'ada', email: 'nope', password: 'longenough' }, 'invalid email'],
    [{ username: 'ada', email: 'a@b.co', password: 'short' }, 'short password'],
    [{ username: 'ada', email: 'a@b.co', password: 'x'.repeat(73) }, 'over bcrypt limit'],
  ])('rejects %j (%s)', (payload) => expect(SignupSchema.safeParse(payload).success).toBe(false));

  it('accepts identifier or legacy username for signin', () => {
    expect(SigninSchema.parse({ identifier: 'a@b.co', password: 'x' }).identifier).toBe('a@b.co');
    expect(SigninSchema.parse({ username: 'ada', password: 'x' }).identifier).toBe('ada');
    expect(SigninSchema.safeParse({ password: 'x' }).success).toBe(false);
  });
});
