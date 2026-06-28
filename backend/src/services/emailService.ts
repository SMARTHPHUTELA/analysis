import nodemailer    from 'nodemailer';
import { config }    from '../config/config';
import { logger }    from '../config/logger';

const transporter = nodemailer.createTransport({
  host:   config.smtp.host,
  port:   config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const emailService = {
  async sendPasswordReset(
    to:        string,
    name:      string,
    resetLink: string
  ): Promise<void> {
    try {
      await transporter.sendMail({
        from:    config.smtp.from,
        to,
        subject: 'Reset your AI Cost Proxy password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <div style="background:#4f6ef7;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:20px">
                ⚡ AI Cost Proxy
              </h1>
            </div>
            <div style="background:white;padding:32px;border:1px solid #e5e7eb;
                        border-top:none;border-radius:0 0 12px 12px">
              <h2 style="color:#111827;margin-top:0">Reset your password</h2>
              <p style="color:#6b7280">Hi ${name},</p>
              <p style="color:#6b7280">
                Someone requested a password reset for your account.
                Click the button below to set a new password.
                This link expires in <strong>1 hour</strong>.
              </p>
              <a href="${resetLink}"
                 style="display:inline-block;background:#4f6ef7;color:white;
                        padding:12px 24px;border-radius:8px;text-decoration:none;
                        font-weight:600;margin:16px 0">
                Reset Password
              </a>
              <p style="color:#9ca3af;font-size:13px;margin-top:24px">
                If you didn't request this, you can safely ignore this email.
                Your password won't change.
              </p>
              <p style="color:#9ca3af;font-size:12px">
                Or copy this link: <br/>
                <span style="color:#4f6ef7">${resetLink}</span>
              </p>
            </div>
          </div>
        `,
      });
      logger.info({ to }, 'Password reset email sent');
    } catch (err) {
      logger.error({ err, to }, 'Failed to send password reset email');
      throw err;
    }
  },
};