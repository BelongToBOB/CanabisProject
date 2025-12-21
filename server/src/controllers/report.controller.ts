import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  /**
   * GET /api/reports/inventory
   * Generate inventory report with optional filtering
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   * Query params: productName (optional)
   */
  static async getInventoryReport(req: Request, res: Response): Promise<void> {
    try {
      const { productName } = req.query;

      const filters = productName ? { productName: productName as string } : undefined;

      const report = await ReportService.generateInventoryReport(filters);

      res.status(200).json(report);
    } catch (error) {
      console.error('Error generating inventory report:', error);
      res.status(500).json({
        error: 'Failed to generate inventory report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/reports/monthly-profit
   * Generate monthly profit summary
   * Requirements: 6.1, 6.2, 6.3, 6.4
   * Query params: month (required), year (required)
   */
  static async getMonthlyProfitSummary(req: Request, res: Response): Promise<void> {
    try {
      const { month, year } = req.query;

      // Validate required parameters
      if (!month || !year) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Month and year are required query parameters',
        });
        return;
      }

      const monthNum = parseInt(month as string, 10);
      const yearNum = parseInt(year as string, 10);

      // Validate month and year are valid numbers
      if (isNaN(monthNum) || isNaN(yearNum)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Month and year must be valid numbers',
        });
        return;
      }

      const summary = await ReportService.generateMonthlyProfitSummary(monthNum, yearNum);

      res.status(200).json(summary);
    } catch (error) {
      console.error('Error generating monthly profit summary:', error);
      
      // Handle validation errors from service
      if (error instanceof Error && (
        error.message.includes('Month must be') || 
        error.message.includes('Year must be')
      )) {
        res.status(400).json({
          error: 'Validation error',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to generate monthly profit summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
