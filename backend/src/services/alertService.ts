import axios                  from 'axios';
import { budgetRepository }   from '../repositories/budgetRepository';
import { queryOne }           from '../config/database';
import { logger }             from '../config/logger';
import { config }             from '../config/config';
import { Organization }       from '../types';

// Tracks which orgs have already been alerted this month
// so we don't spam on every request after crossing the threshold
const alertedThisMonth = new Map<string, Set<number>>();

function getAlertedSet(organizationId: string): Set<number> {
  if (!alertedThisMonth.has(organizationId)) {
    alertedThisMonth.set(organizationId, new Set());
  }
  return alertedThisMonth.get(organizationId)!;
}

export const alertService = {
  async checkAndNotify(
    organizationId: string,
    monthlyBudget: number
  ): Promise<void> {
    if (!monthlyBudget || monthlyBudget <= 0) return;

    const summary = await budgetRepository.getCurrentMonthSummary(organizationId);
    if (!summary) return;

    const spent      = Number(summary.total_cost);
    const percentage = (spent / monthlyBudget) * 100;
    const alerted    = getAlertedSet(organizationId);

    // 80% threshold
    if (percentage >= 80 && percentage < 100 && !alerted.has(80)) {
      alerted.add(80);
      const org = await getOrg(organizationId);
      if (org) {
        await sendAlert({
          org,
          spent,
          monthlyBudget,
          percentage,
          level: 'warning',
        });
      }
    }

    // 100% threshold
    if (percentage >= 100 && !alerted.has(100)) {
      alerted.add(100);
      const org = await getOrg(organizationId);
      if (org) {
        await sendAlert({
          org,
          spent,
          monthlyBudget,
          percentage,
          level: 'critical',
        });
      }
    }
  },

  // Call this at the start of each month (or on key rotation) to reset
  clearAlertState(organizationId: string): void {
    alertedThisMonth.delete(organizationId);
  },
};

// ── Helpers ────────────────────────────────────────────────────

async function getOrg(organizationId: string): Promise<Organization | null> {
  return queryOne<Organization>(
    `SELECT * FROM organizations WHERE id = $1`,
    [organizationId]
  );
}

interface AlertPayload {
  org: Organization;
  spent: number;
  monthlyBudget: number;
  percentage: number;
  level: 'warning' | 'critical';
}

async function sendAlert(payload: AlertPayload): Promise<void> {
  const { org, spent, monthlyBudget, percentage, level } = payload;

  const emoji   = level === 'critical' ? '🚨' : '⚠️';
  const title   = level === 'critical'
    ? `Budget Exhausted — Requests Blocked`
    : `Budget Alert — ${Math.round(percentage)}% Used`;

  const message = `${emoji} *${title}*\n` +
    `*Organization:* ${org.name}\n` +
    `*Spent:* $${spent.toFixed(4)} / $${monthlyBudget.toFixed(2)}\n` +
    `*Usage:* ${Math.round(percentage)}%\n` +
    `*Status:* ${level === 'critical' ? 'All requests are now blocked.' : 'Approaching limit.'}`;

  const tasks: Promise<void>[] = [];

  // Slack
  const webhookUrl = org.slack_webhook ?? config.alerts.slackWebhookUrl;
  if (webhookUrl) {
    tasks.push(sendSlack(webhookUrl, message));
  }

  // Email
  const email = org.alert_email ?? config.alerts.fromEmail;
  if (email) {
    tasks.push(sendEmail(email, title, message));
  }

  await Promise.allSettled(tasks);
  logger.info({ organizationId: org.id, level, percentage }, 'Budget alert sent');
}

async function sendSlack(webhookUrl: string, text: string): Promise<void> {
  await axios.post(webhookUrl, { text }, { timeout: 5000 });
}

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  // Using SendGrid — swap for any email provider
  if (!config.alerts.slackWebhookUrl) {
    logger.warn('No email provider configured — skipping email alert');
    return;
  }

  await axios.post(
    'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email: to }] }],
      from:             { email: config.alerts.fromEmail ?? 'alerts@yourdomain.com' },
      subject,
      content:          [{ type: 'text/plain', value: body }],
    },
    {
      headers: {
        Authorization: `Bearer ${config.alerts.slackWebhookUrl}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    }
  );
}