import { Request, Response }      from 'express';
import { authService }            from '../services/authService';
import { userRepository }         from '../repositories/userRepository';
import { sendSuccess, sendError } from '../utils/response';
import { config }                 from '../config/config';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   config.env === 'production',
  sameSite: 'lax' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  path:     '/',
};

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const {
      name, email, password,
      org_name, org_slug, monthly_budget,
    } = req.body;

    if (!name || !email || !password || !org_name || !org_slug) {
      sendError(res, 'name, email, password, org_name and org_slug are required', 400);
      return;
    }

    if (password.length < 8) {
      sendError(res, 'Password must be at least 8 characters', 400);
      return;
    }

    try {
      const { user, org, token } = await authService.register({
        name,
        email,
        password,
        orgName:       org_name,
        orgSlug:       org_slug,
        monthlyBudget: monthly_budget,
      });

      res.cookie('acp_token', token, COOKIE_OPTIONS);

      sendSuccess(res, {
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
        },
        org: {
          id:             org.id,
          name:           org.name,
          slug:           org.slug,
          monthly_budget: org.monthly_budget,
        },
      }, 201);
    } catch (err: any) {
      if (err.code === '23505') {
        sendError(res, 'Organization slug already taken', 409);
        return;
      }
      sendError(res, err.message, 400);
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'Email and password are required', 400);
      return;
    }

    try {
      const { user, token } = await authService.login(email, password);

      res.cookie('acp_token', token, COOKIE_OPTIONS);

      sendSuccess(res, {
        user: {
          id:             user.id,
          name:           user.name,
          email:          user.email,
          role:           user.role,
          organization_id: user.organization_id,
        },
      });
    } catch (err: any) {
      sendError(res, err.message, 401);
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('acp_token', { path: '/' });
    sendSuccess(res, { message: 'Logged out successfully' });
  },

  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = await userRepository.findById(req.user.userId);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }
      sendSuccess(res, {
        id:              user.id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        organization_id: user.organization_id,
      });
    } catch (err) {
      sendError(res, 'Failed to fetch user', 500);
    }
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      sendError(res, 'Email is required', 400);
      return;
    }
    try {
      await authService.forgotPassword(email);
      // Always return 200 so we don't reveal if email exists
      sendSuccess(res, {
        message: 'If an account exists with that email, a reset link has been sent',
      });
    } catch {
      sendSuccess(res, {
        message: 'If an account exists with that email, a reset link has been sent',
      });
    }
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;
    if (!token || !password) {
      sendError(res, 'Token and password are required', 400);
      return;
    }
    if (password.length < 8) {
      sendError(res, 'Password must be at least 8 characters', 400);
      return;
    }
    try {
      await authService.resetPassword(token, password);
      sendSuccess(res, { message: 'Password reset successfully. You can now log in.' });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },
};