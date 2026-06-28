import { Request, Response }      from 'express';
import { usageRepository }        from '../repositories/usageRepository';
import { budgetRepository }       from '../repositories/budgetRepository';
import { sendSuccess, sendError } from '../utils/response';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const analyticsController = {
  async summary(req: Request, res: Response): Promise<void> {
    try {
      const orgId   = req.params['orgId'];
      const summary = await budgetRepository.getCurrentMonthSummary(orgId);
      const history = await budgetRepository.getHistoricalSummaries(orgId, 6);
      sendSuccess(res, { current_month: summary, history });
    } catch (err) {
      sendError(res, 'Failed to fetch summary', 500);
    }
  },

  async daily(req: Request, res: Response): Promise<void> {
    try {
      const orgId    = req.params['orgId'];
      const days     = parseInt(req.query['days'] as string ?? '30', 10);
      const fromDate = startOfDay(subDays(new Date(), days));
      const toDate   = endOfDay(new Date());
      const data     = await usageRepository.getDailySpend(orgId, fromDate, toDate);
      sendSuccess(res, data);
    } catch (err) {
      sendError(res, 'Failed to fetch daily spend', 500);
    }
  },

  async features(req: Request, res: Response): Promise<void> {
    try {
      const orgId    = req.params['orgId'];
      const days     = parseInt(req.query['days'] as string ?? '30', 10);
      const fromDate = startOfDay(subDays(new Date(), days));
      const toDate   = endOfDay(new Date());
      const data     = await usageRepository.getFeatureBreakdown(orgId, fromDate, toDate);
      sendSuccess(res, data);
    } catch (err) {
      sendError(res, 'Failed to fetch feature breakdown', 500);
    }
  },

  async models(req: Request, res: Response): Promise<void> {
    try {
      const orgId    = req.params['orgId'];
      const days     = parseInt(req.query['days'] as string ?? '30', 10);
      const fromDate = startOfDay(subDays(new Date(), days));
      const toDate   = endOfDay(new Date());
      const data     = await usageRepository.getModelBreakdown(orgId, fromDate, toDate);
      sendSuccess(res, data);
    } catch (err) {
      sendError(res, 'Failed to fetch model breakdown', 500);
    }
  },

  async logs(req: Request, res: Response): Promise<void> {
    try {
      const orgId  = req.params['orgId'];
      const limit  = parseInt(req.query['limit']  as string ?? '100', 10);
      const offset = parseInt(req.query['offset'] as string ?? '0',   10);
      const data   = await usageRepository.findByOrganization(orgId, limit, offset);
      sendSuccess(res, data);
    } catch (err) {
      sendError(res, 'Failed to fetch logs', 500);
    }
  },

  async savings(req: Request, res: Response): Promise<void> {
    try {
      const orgId    = req.params['orgId'];
      const days     = parseInt(req.query['days'] as string ?? '30', 10);
      const fromDate = startOfDay(subDays(new Date(), days));
      const toDate   = endOfDay(new Date());
      const data     = await usageRepository.getTotalSavings(orgId, fromDate, toDate);
      sendSuccess(res, data);
    } catch (err) {
      sendError(res, 'Failed to fetch savings', 500);
    }
  },

  async platformSummary(req: Request, res: Response): Promise<void> {
    try {
      const data = await usageRepository.getPlatformSummary();
      sendSuccess(res, data);
    } catch (err) {
      sendError(res, 'Failed to fetch platform summary', 500);
    }
  },
};