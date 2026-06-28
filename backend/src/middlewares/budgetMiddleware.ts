import { Request, Response, NextFunction } from 'express';
import { budgetRepository } from '../repositories/budgetRepository';
import { sendError }        from '../utils/response';
import { logger }           from '../config/logger';

export async function budgetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { organizationId, monthlyBudget } = req.ctx;

  // No budget set means unlimited
  if (!monthlyBudget || monthlyBudget <= 0) return next();

  try {
    const summary = await budgetRepository.getCurrentMonthSummary(organizationId);
    const spent   = summary ? Number(summary.total_cost) : 0;

    if (spent >= monthlyBudget) {
      logger.warn({ organizationId, spent, monthlyBudget }, 'Budget 100% — blocking request');
      sendError(
        res,
        `Monthly budget of $${monthlyBudget} exceeded. Current spend: $${spent.toFixed(4)}`,
        429
      );
      return;
    }

    // Attach spend to ctx so alert service can use it downstream
    (req.ctx as any).currentSpend = spent;

    return next();
  } catch (err) {
    logger.error({ err }, 'Budget middleware error');
    // Fail open — don't block the request if budget check itself errors
    return next();
  }
}