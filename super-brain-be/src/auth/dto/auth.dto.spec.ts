import { SignupSchema, SigninSchema } from './auth.dto';

describe('Auth DTO Validation', () => {
  it('validates a correct signup payload', () => {
    const valid = {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    };
    const result = SignupSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email or short password in signup', () => {
    const invalidEmail = {
      username: 'johndoe',
      email: 'invalid-email',
      password: '123',
    };
    const result = SignupSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });

  it('validates signin payload', () => {
    const valid = {
      username: 'johndoe',
      password: 'secretPassword',
    };
    const result = SigninSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
