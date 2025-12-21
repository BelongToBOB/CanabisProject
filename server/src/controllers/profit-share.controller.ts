import { Request, Response } from 'express';
import { ProfitShareService } from '../services/profit-share.service';

export class ProfitShareController {
  /**
   * GET /api/profit-shares
   * Get all profit share records
   * Requirements: 9.1, 9.2
   */
  static async getProfitShares(_req: Request, res: Response): Promise<void> {
    try {
      const profitShares = await ProfitShareService.getProfitShares();
      res.status(200).json(profitShares);
    } catch (error) {
      console.error('Error retrieving profit shares:', error);
      res.status(500).json({
        error: 'Failed to retrieve profit shares',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/profit-shares/:id
   * Get specific profit share by ID
   * Requirements: 9.1
   */
  static async getProfitShareById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid profit share ID',
        });
        return;
      }

      const profitShare = await ProfitShareService.getProfitShareById(id);

      if (!profitShare) {
        res.status(404).json({
          error: 'Not found',
          message: 'Profit share not found',
        });
        return;
      }

      res.status(200).json(profitShare);
    } catch (error) {
      console.error('Error retrieving profit share:', error);
      res.status(500).json({
        error: 'Failed to retrieve profit share',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/profit-shares/execute
   * Manually trigger profit split execution for a specific month/year
   * Requirements: 7.1, 7.2
   * Body: { month: number, year: number }
   */
  static async executeProfitSplit(req: Request, res: Response): Promise<void> {
    try {
      const { month, year } = req.body;

      // Validate required fields
      if (month === undefined || year === undefined) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Month and year are required',
        });
        return;
      }

      // Validate types
      if (!Number.isInteger(month) || !Number.isInteger(year)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Month and year must be integers',
        });
        return;
      }

      const profitShare = await ProfitShareService.executeProfitSplit({ month, year });

      res.status(201).json(profitShare);
    } catch (error) {
      console.error('Error executing profit split:', error);

      // Handle validation errors from service
      if (error instanceof Error) {
        if (
          error.message.includes('Month must be') ||
          error.message.includes('Year must be') ||
          error.message.includes('already executed')
        ) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Failed to execute profit split',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
