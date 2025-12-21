import cron from 'node-cron';
import { ProfitShareService } from './profit-share.service';

export class SchedulerService {
  private static cronJob: cron.ScheduledTask | null = null;

  /**
   * Initialize the scheduler service
   * Requirements: 7.1, 7.4
   * Sets up a cron job to run daily at midnight
   */
  static initializeScheduler(): void {
    // Configure cron job to run daily at midnight (00:00)
    // Cron format: second minute hour day month weekday
    // '0 0 * * *' means: at 00:00 every day
    this.cronJob = cron.schedule('0 0 * * *', async () => {
      console.log('[SchedulerService] Daily check running at:', new Date().toISOString());
      await this.executeDailyCheck();
    });

    console.log('[SchedulerService] Scheduler initialized - will run daily at midnight');
  }

  /**
   * Execute daily check to determine if profit split should run
   * Requirements: 7.1, 7.4
   * Checks if current date is 24th of month and triggers profit split for previous month
   */
  static async executeDailyCheck(): Promise<void> {
    try {
      const now = new Date();
      const currentDay = now.getDate();

      // Requirement 7.4: Check if current date is 24th of month
      if (currentDay !== 24) {
        console.log(`[SchedulerService] Not the 24th (current day: ${currentDay}), skipping profit split`);
        return;
      }

      console.log('[SchedulerService] It is the 24th - executing profit split for previous month');

      // Calculate previous month and year
      const previousMonth = now.getMonth(); // getMonth() returns 0-11, so current month - 1 in 0-based
      const previousYear = now.getFullYear();

      // Adjust for January (month 0) - previous month would be December of previous year
      const targetMonth = previousMonth === 0 ? 12 : previousMonth;
      const targetYear = previousMonth === 0 ? previousYear - 1 : previousYear;

      console.log(`[SchedulerService] Executing profit split for ${targetMonth}/${targetYear}`);

      // Requirement 7.1: Trigger profit split execution for previous month
      const result = await ProfitShareService.executeProfitSplit({
        month: targetMonth,
        year: targetYear,
      });

      console.log('[SchedulerService] Profit split executed successfully:', {
        month: result.month,
        year: result.year,
        totalProfit: result.totalProfit,
        amountPerOwner: result.amountPerOwner,
        executionDate: result.executionDate,
      });
    } catch (error) {
      // Error handling and logging
      if (error instanceof Error) {
        console.error('[SchedulerService] Error during daily check:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });

        // If it's a duplicate profit split error, log as info instead of error
        if (error.message.includes('already executed')) {
          console.log('[SchedulerService] Profit split already executed for this month - skipping');
        }
      } else {
        console.error('[SchedulerService] Unknown error during daily check:', error);
      }
    }
  }

  /**
   * Stop the scheduler (useful for testing and graceful shutdown)
   */
  static stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('[SchedulerService] Scheduler stopped');
    }
  }

  /**
   * Start the scheduler if it was previously stopped
   */
  static startScheduler(): void {
    if (this.cronJob) {
      this.cronJob.start();
      console.log('[SchedulerService] Scheduler started');
    }
  }

  /**
   * Check if scheduler is running
   */
  static isRunning(): boolean {
    return this.cronJob !== null;
  }
}
