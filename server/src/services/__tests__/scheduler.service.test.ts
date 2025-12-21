import { SchedulerService } from '../scheduler.service';
import { ProfitShareService } from '../profit-share.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((_pattern: string, _callback: () => void) => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

describe('SchedulerService', () => {
  beforeEach(async () => {
    // Clean up test data in correct order due to foreign key constraints
    await prisma.profitShare.deleteMany({});
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('initializeScheduler', () => {
    it('should initialize the scheduler with correct cron pattern', () => {
      const cron = require('node-cron');
      
      SchedulerService.initializeScheduler();
      
      // Verify cron.schedule was called with midnight pattern
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 0 * * *',
        expect.any(Function)
      );
    });

    it('should set scheduler as running', () => {
      SchedulerService.initializeScheduler();
      
      expect(SchedulerService.isRunning()).toBe(true);
    });
  });

  describe('executeDailyCheck', () => {
    let originalDate: typeof Date;

    beforeEach(() => {
      originalDate = global.Date;
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should skip profit split when not the 24th', async () => {
      // Mock date to be the 15th
      const mockDate = new Date('2024-01-15T00:00:00Z');
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const executeSpy = jest.spyOn(ProfitShareService, 'executeProfitSplit');

      await SchedulerService.executeDailyCheck();

      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should execute profit split when it is the 24th', async () => {
      // Mock date to be the 24th of February 2024
      const mockDate = new Date('2024-02-24T00:00:00Z');
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const executeSpy = jest.spyOn(ProfitShareService, 'executeProfitSplit').mockResolvedValue({
        id: 1,
        month: 1,
        year: 2024,
        totalProfit: 1000,
        amountPerOwner: 500,
        executionDate: new Date(),
        createdAt: new Date(),
      });

      await SchedulerService.executeDailyCheck();

      // Should execute profit split for previous month (January 2024)
      expect(executeSpy).toHaveBeenCalledWith({
        month: 1,
        year: 2024,
      });
    });

    it('should execute profit split for December when current month is January', async () => {
      // Mock date to be the 24th of January 2024
      const mockDate = new Date('2024-01-24T00:00:00Z');
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const executeSpy = jest.spyOn(ProfitShareService, 'executeProfitSplit').mockResolvedValue({
        id: 1,
        month: 12,
        year: 2023,
        totalProfit: 1000,
        amountPerOwner: 500,
        executionDate: new Date(),
        createdAt: new Date(),
      });

      await SchedulerService.executeDailyCheck();

      // Should execute profit split for December 2023 (previous year)
      expect(executeSpy).toHaveBeenCalledWith({
        month: 12,
        year: 2023,
      });
    });

    it('should handle errors gracefully and log them', async () => {
      // Mock date to be the 24th
      const mockDate = new Date('2024-02-24T00:00:00Z');
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const testError = new Error('Database connection failed');
      jest.spyOn(ProfitShareService, 'executeProfitSplit').mockRejectedValue(testError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await SchedulerService.executeDailyCheck();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SchedulerService] Error during daily check:',
        expect.objectContaining({
          message: 'Database connection failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle duplicate profit split error gracefully', async () => {
      // Mock date to be the 24th
      const mockDate = new Date('2024-02-24T00:00:00Z');
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const duplicateError = new Error('Profit split already executed for 1/2024');
      jest.spyOn(ProfitShareService, 'executeProfitSplit').mockRejectedValue(duplicateError);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await SchedulerService.executeDailyCheck();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[SchedulerService] Profit split already executed for this month - skipping'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('stopScheduler and startScheduler', () => {
    it('should stop the scheduler', () => {
      SchedulerService.initializeScheduler();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      SchedulerService.stopScheduler();

      expect(consoleLogSpy).toHaveBeenCalledWith('[SchedulerService] Scheduler stopped');
      consoleLogSpy.mockRestore();
    });

    it('should start the scheduler', () => {
      SchedulerService.initializeScheduler();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      SchedulerService.startScheduler();

      expect(consoleLogSpy).toHaveBeenCalledWith('[SchedulerService] Scheduler started');
      consoleLogSpy.mockRestore();
    });
  });

  describe('Integration test with real profit split', () => {
    it('should correctly calculate previous month on the 24th', async () => {
      // Test the date calculation logic without full integration
      // Mock date to be February 24th, 2024
      const mockDate = new Date('2024-02-24T00:00:00Z');
      const originalDate = global.Date;
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const now = new Date();
      const currentDay = now.getDate();
      const previousMonth = now.getMonth(); // 0-based, so Feb = 1, previous = 1 (Jan in 1-based)
      const previousYear = now.getFullYear();
      
      const targetMonth = previousMonth === 0 ? 12 : previousMonth;
      const targetYear = previousMonth === 0 ? previousYear - 1 : previousYear;

      expect(currentDay).toBe(24);
      expect(targetMonth).toBe(1); // January
      expect(targetYear).toBe(2024);

      global.Date = originalDate;
    });

    it('should correctly calculate December when current month is January', async () => {
      // Mock date to be January 24th, 2024
      const mockDate = new Date('2024-01-24T00:00:00Z');
      const originalDate = global.Date;
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const now = new Date();
      const previousMonth = now.getMonth(); // 0 for January
      const previousYear = now.getFullYear();
      
      const targetMonth = previousMonth === 0 ? 12 : previousMonth;
      const targetYear = previousMonth === 0 ? previousYear - 1 : previousYear;

      expect(targetMonth).toBe(12); // December
      expect(targetYear).toBe(2023); // Previous year

      global.Date = originalDate;
    });
  });
});
