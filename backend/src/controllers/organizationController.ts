import { Request, Response }  from 'express';
import { query, queryOne }    from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { Organization }       from '../types';

export const organizationController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const orgs = await query<Organization>(
        `SELECT id, name, slug, monthly_budget, status, alert_email, created_at
         FROM organizations
         WHERE status != 'deleted'
         ORDER BY created_at DESC`
      );
      sendSuccess(res, orgs);
    } catch (err) {
      sendError(res, 'Failed to fetch organizations', 500);
    }
  },

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const org = await queryOne<Organization>(
        `SELECT id, name, slug, monthly_budget, status, alert_email, created_at
         FROM organizations WHERE id = $1`,
        [req.params['id']]
      );
      if (!org) { sendError(res, 'Organization not found', 404); return; }
      sendSuccess(res, org);
    } catch (err) {
      sendError(res, 'Failed to fetch organization', 500);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    const { name, slug, monthly_budget, alert_email, slack_webhook } = req.body;

    if (!name || !slug) {
      sendError(res, 'name and slug are required', 400);
      return;
    }

    try {
      const org = await queryOne<Organization>(
        `INSERT INTO organizations (name, slug, monthly_budget, alert_email, slack_webhook)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, slug, monthly_budget ?? 0, alert_email ?? null, slack_webhook ?? null]
      );
      sendSuccess(res, org, 201);
    } catch (err: any) {
      if (err.code === '23505') {
        sendError(res, 'Slug already exists', 409);
        return;
      }
      sendError(res, 'Failed to create organization', 500);
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    const { name, monthly_budget, alert_email, slack_webhook, status } = req.body;

    try {
      const org = await queryOne<Organization>(
        `UPDATE organizations SET
           name           = COALESCE($1, name),
           monthly_budget = COALESCE($2, monthly_budget),
           alert_email    = COALESCE($3, alert_email),
           slack_webhook  = COALESCE($4, slack_webhook),
           status         = COALESCE($5, status),
           updated_at     = NOW()
         WHERE id = $6
         RETURNING *`,
        [name, monthly_budget, alert_email, slack_webhook, status, req.params['id']]
      );
      if (!org) { sendError(res, 'Organization not found', 404); return; }
      sendSuccess(res, org);
    } catch (err) {
      sendError(res, 'Failed to update organization', 500);
    }
  },
};