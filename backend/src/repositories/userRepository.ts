import { query, queryOne } from '../config/database';

export interface User {
  id:              string;
  organization_id: string | null;
  name:            string;
  email:           string;
  password_hash:   string;
  role:            'admin' | 'manager';
  is_active:       boolean;
  created_at:      Date;
  updated_at:      Date;
}

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE email = $1 AND is_active = TRUE`,
      [email.toLowerCase().trim()]
    );
  },

  async findById(id: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
  },

  async create(data: {
    name:           string;
    email:          string;
    passwordHash:   string;
    role:           'admin' | 'manager';
    organizationId: string | null;
  }): Promise<User> {
    const rows = await query<User>(
      `INSERT INTO users
         (name, email, password_hash, role, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.email.toLowerCase().trim(),
        data.passwordHash,
        data.role,
        data.organizationId,
      ]
    );
    return rows[0];
  },

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );
  },

  // ── Password reset tokens ──────────────────────────────────

  async createResetToken(data: {
    userId:    string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    // Invalidate any existing tokens for this user first
    await query(
      `DELETE FROM password_reset_tokens WHERE user_id = $1`,
      [data.userId]
    );
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [data.userId, data.tokenHash, data.expiresAt]
    );
  },

  async findResetToken(tokenHash: string): Promise<{
    id:         string;
    user_id:    string;
    expires_at: Date;
    used_at:    Date | null;
  } | null> {
    return queryOne(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
      [tokenHash]
    );
  },

  async markResetTokenUsed(tokenHash: string): Promise<void> {
    await query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE token_hash = $1`,
      [tokenHash]
    );
  },
};