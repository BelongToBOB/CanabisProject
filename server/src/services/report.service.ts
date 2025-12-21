import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface InventoryReportFilters {
  productName?: string;
}

export interface InventoryReportItem {
  id: number;
  batchIdentifier: string;
  productName: string;
  currentQuantity: number;
  purchasePricePerUnit: number;
  isDepleted: boolean;
}

export interface InventoryReportResponse {
  items: InventoryReportItem[];
  totalInventoryValue: number;
}

export interface MonthlyProfitSummaryResponse {
  month: number;
  year: number;
  totalProfit: number;
  numberOfOrders: number;
  startDate: Date;
  endDate: Date;
}

export class ReportService {
  /**
   * Generate inventory report with filtering and ordering
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   * @param filters - Optional filters (e.g., productName)
   * @returns Inventory report with items and total value
   */
  static async generateInventoryReport(
    filters?: InventoryReportFilters
  ): Promise<InventoryReportResponse> {
    const where: any = {};

    // Requirement 10.3: Filter by product name if specified
    if (filters?.productName) {
      where.productName = filters.productName;
    }

    // Requirement 10.1: Display all batches with required fields
    // Requirement 10.5: Order by product name and batch identifier
    const batches = await prisma.batch.findMany({
      where,
      orderBy: [
        { productName: 'asc' },
        { batchIdentifier: 'asc' },
      ],
    });

    // Convert batches to inventory report items
    const items: InventoryReportItem[] = batches.map(batch => ({
      id: batch.id,
      batchIdentifier: batch.batchIdentifier,
      productName: batch.productName,
      currentQuantity: batch.currentQuantity,
      purchasePricePerUnit: batch.purchasePricePerUnit.toNumber(),
      // Requirement 10.4: Identify depleted batches (zero quantity)
      isDepleted: batch.currentQuantity === 0,
    }));

    // Requirement 10.2: Calculate total inventory value
    // totalValue = sum of (currentQuantity * purchasePricePerUnit) for all batches
    const totalInventoryValue = batches.reduce((sum, batch) => {
      const batchValue = batch.currentQuantity * batch.purchasePricePerUnit.toNumber();
      return sum + batchValue;
    }, 0);

    return {
      items,
      totalInventoryValue,
    };
  }

  /**
   * Generate monthly profit summary for a specific month and year
   * Requirements: 6.1, 6.2, 6.3, 6.4
   * @param month - Month number (1-12)
   * @param year - Year (e.g., 2024)
   * @returns Monthly profit summary
   */
  static async generateMonthlyProfitSummary(
    month: number,
    year: number
  ): Promise<MonthlyProfitSummaryResponse> {
    // Validate month
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    // Validate year
    if (year < 2020) {
      throw new Error('Year must be 2020 or later');
    }

    // Requirement 6.3: Determine monthly boundaries based on calendar months
    const startDate = new Date(year, month - 1, 1); // First day of month
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    // Requirement 6.1: Calculate total profit from all sales orders within that month
    const orders = await prisma.salesOrder.findMany({
      where: {
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate total profit and count orders
    const totalProfit = orders.reduce((sum, order) => {
      return sum + order.totalProfit.toNumber();
    }, 0);

    const numberOfOrders = orders.length;

    // Requirement 6.2: Display total profit, number of orders, and date range
    // Requirement 6.4: Return zero profit and zero orders when no sales exist
    return {
      month,
      year,
      totalProfit,
      numberOfOrders,
      startDate,
      endDate,
    };
  }
}
