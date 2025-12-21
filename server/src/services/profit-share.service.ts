import { PrismaClient, ProfitShare } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface ExecuteProfitSplitInput {
  month: number;
  year: number;
}

export interface ProfitShareResponse {
  id: number;
  month: number;
  year: number;
  totalProfit: number;
  amountPerOwner: number;
  executionDate: Date;
  createdAt: Date;
}

export class ProfitShareService {
  /**
   * Convert ProfitShare model to ProfitShareResponse (convert Decimal to number)
   */
  private static toProfitShareResponse(profitShare: ProfitShare): ProfitShareResponse {
    return {
      id: profitShare.id,
      month: profitShare.month,
      year: profitShare.year,
      totalProfit: profitShare.totalProfit.toNumber(),
      amountPerOwner: profitShare.amountPerOwner.toNumber(),
      executionDate: profitShare.executionDate,
      createdAt: profitShare.createdAt,
    };
  }

  /**
   * Check if profit split has already been executed for a given month/year
   * Requirements: 7.5
   * @param month - Month (1-12)
   * @param year - Year
   * @returns True if already executed, false otherwise
   */
  private static async checkIfAlreadyExecuted(month: number, year: number): Promise<boolean> {
    const existing = await prisma.profitShare.findUnique({
      where: {
        month_year: {
          month,
          year,
        },
      },
    });

    return existing !== null;
  }

  /**
   * Execute profit split for a specified month/year
   * Requirements: 7.1, 7.2, 7.3, 7.5, 8.1
   * @param data - Month and year to execute profit split for
   * @returns Created profit share record
   */
  static async executeProfitSplit(data: ExecuteProfitSplitInput): Promise<ProfitShareResponse> {
    const { month, year } = data;

    // Validate month and year
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error('Month must be an integer between 1 and 12');
    }

    if (!Number.isInteger(year) || year < 2020) {
      throw new Error('Year must be an integer >= 2020');
    }

    // Requirement 7.5: Check if profit split already executed for this month
    const alreadyExecuted = await this.checkIfAlreadyExecuted(month, year);
    if (alreadyExecuted) {
      throw new Error(`Profit split already executed for ${month}/${year}`);
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Requirement 7.1: Calculate total profit from all unlocked orders in the specified month
    const orders = await prisma.salesOrder.findMany({
      where: {
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
        isLocked: false,
      },
    });

    // Calculate total profit
    const totalProfit = orders.reduce((sum, order) => {
      return sum + order.totalProfit.toNumber();
    }, 0);

    // Requirement 7.2: Calculate 50/50 split
    const amountPerOwner = totalProfit / 2;

    // Execute in transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Requirement 7.3: Create profit share record
      const profitShare = await tx.profitShare.create({
        data: {
          month,
          year,
          totalProfit: new Decimal(totalProfit),
          amountPerOwner: new Decimal(amountPerOwner),
          executionDate: new Date(),
        },
      });

      // Requirement 8.1: Lock all sales orders from that month
      await tx.salesOrder.updateMany({
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
          isLocked: false,
        },
        data: {
          isLocked: true,
        },
      });

      return profitShare;
    });

    return this.toProfitShareResponse(result);
  }

  /**
   * Get all profit share records
   * Requirements: 9.1, 9.2
   * @returns Array of profit share records ordered by execution date (most recent first)
   */
  static async getProfitShares(): Promise<ProfitShareResponse[]> {
    // Requirement 9.2: Order by execution date descending (most recent first)
    const profitShares = await prisma.profitShare.findMany({
      orderBy: {
        executionDate: 'desc',
      },
    });

    return profitShares.map(ps => this.toProfitShareResponse(ps));
  }

  /**
   * Get profit share by ID
   * Requirements: 9.1
   * @param id - Profit share ID
   * @returns Profit share or null if not found
   */
  static async getProfitShareById(id: number): Promise<ProfitShareResponse | null> {
    const profitShare = await prisma.profitShare.findUnique({
      where: { id },
    });

    if (!profitShare) {
      return null;
    }

    return this.toProfitShareResponse(profitShare);
  }

  /**
   * Get profit share by month and year
   * @param month - Month (1-12)
   * @param year - Year
   * @returns Profit share or null if not found
   */
  static async getProfitShareByMonthYear(
    month: number,
    year: number
  ): Promise<ProfitShareResponse | null> {
    const profitShare = await prisma.profitShare.findUnique({
      where: {
        month_year: {
          month,
          year,
        },
      },
    });

    if (!profitShare) {
      return null;
    }

    return this.toProfitShareResponse(profitShare);
  }
}
