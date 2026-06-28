import bcrypt              from 'bcrypt';
import crypto              from 'crypto';
import { userRepository }  from '../repositories/userRepository';
import { emailService }    from './emailService';
import { signToken }       from '../utils/jwt';
import { withTransaction } from '../config/database';
import { config }          from '../config/config';
import { logger }          from '../config/logger';

const SALT_ROUNDS  = 12;
const RESET_EXPIRY = 60 * 60 * 1000; // 1 hour in ms

export const authService = {
  async register(data: {
    name:          string;
    email:         string;
    password:      string;
    orgName:       string;
    orgSlug:       string;
    monthlyBudget?: number;
  }) {
    // Check email not already taken
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new Error('An account with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create org + user in a single transaction
    return withTransaction(async (client) => {
      // 1. Create org
      const orgResult = await client.query(
        `INSERT INTO organizations (name, slug, monthly_budget)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.orgName, data.orgSlug, data.monthlyBudget ?? 0]
      );
      const org = orgResult.rows[0];

      // 2. Create user linked to that org
      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash, role, organization_id)
         VALUES ($1, $2, $3, 'manager', $4)
         RETURNING *`,
        [data.name, data.email.toLowerCase().trim(), passwordHash, org.id]
      );
      const user = userResult.rows[0];

      // 3. Update org with created_by
      await client.query(
        `UPDATE organizations SET created_by = $1 WHERE id = $2`,
        [user.id, org.id]
      );

      const token = signToken({
        userId:         user.id,
        email:          user.email,
        role:           user.role,
        organizationId: org.id,
      });

      return { user, org, token };
    });
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid email or password');

    if (!user.is_active) throw new Error('Account is deactivated');

    const token = signToken({
      userId:         user.id,
      email:          user.email,
      role:           user.role,
      organizationId: user.organization_id,
    });

    return { user, token };
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);

    // Always return success even if user not found (security best practice)
    if (!user) return;

    // Generate a secure random token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash  = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + RESET_EXPIRY);

    await userRepository.createResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetLink =
      `${config.app.frontendUrl}/reset-password?token=${plainToken}`;

    await emailService.sendPasswordReset(user.email, user.name, resetLink);

    logger.info({ userId: user.id }, 'Password reset token created');
  },

  async resetPassword(plainToken: string, newPassword: string): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');

    const resetToken = await userRepository.findResetToken(tokenHash);
    if (!resetToken) throw new Error('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await userRepository.updatePassword(resetToken.user_id, passwordHash);
    await userRepository.markResetTokenUsed(tokenHash);

    logger.info({ userId: resetToken.user_id }, 'Password reset successful');
  },
};