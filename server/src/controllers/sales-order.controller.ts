import { Request, Response } from 'express';
import { SalesOrderService, CreateSalesOrderInput, SalesOrderFilters } from '../services/sales-order.service';

export class SalesOrderController {
  /**
   * Create a new sales order - POST /api/sales-orders
   * Admin and Staff access
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  static async createSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderDate, customerName, lineItems } = req.body;

      // Validate required fields
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Line items are required and must be a non-empty array',
        });
        return;
      }

      // Validate line item structure
      for (const item of lineItems) {
        if (!item.batchId || item.quantitySold === undefined || item.sellingPricePerUnit === undefined) {
          res.status(400).json({
            error: 'Validation error',
            message: 'Each line item must have batchId, quantitySold, and sellingPricePerUnit',
          });
          return;
        }
      }

      const orderData: CreateSalesOrderInput = {
        orderDate: orderDate ? new Date(orderDate) : undefined,
        customerName,
        lineItems,
      };

      const order = await SalesOrderService.createSalesOrder(orderData);

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof Error) {
        // Handle validation errors (batch not found, insufficient stock, etc.)
        if (
          error.message.includes('not found') ||
          error.message.includes('Insufficient stock') ||
          error.message.includes('must be') ||
          error.message.includes('must contain')
        ) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }

        // Handle other errors
        res.status(500).json({
          error: 'Failed to create sales order',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get all sales orders - GET /api/sales-orders
   * Admin only
   * Requirements: 3.1, 5.4
   */
  static async getAllSalesOrders(req: Request, res: Response): Promise<void> {
    try {
      const filters: SalesOrderFilters = {};

      // Add filters from query parameters
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.isLocked !== undefined) {
        filters.isLocked = req.query.isLocked === 'true';
      }
      if (req.query.customerName) {
        filters.customerName = req.query.customerName as string;
      }

      const orders = await SalesOrderService.getSalesOrders(filters);
      res.status(200).json(orders);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Failed to retrieve sales orders',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get sales order by ID - GET /api/sales-orders/:id
   * Admin only
   * Requirements: 3.1, 5.4
   */
  static async getSalesOrderById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid sales order ID',
        });
        return;
      }

      const order = await SalesOrderService.getSalesOrderById(id);

      if (!order) {
        res.status(404).json({
          error: 'Not found',
          message: 'Sales order not found',
        });
        return;
      }

      res.status(200).json(order);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Failed to retrieve sales order',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Delete sales order - DELETE /api/sales-orders/:id
   * Admin only
   * Requirements: 8.2, 8.3 - Prevent deletion of locked orders
   */
  static async deleteSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid sales order ID',
        });
        return;
      }

      const order = await SalesOrderService.deleteSalesOrder(id);

      res.status(200).json({
        message: 'Sales order deleted successfully',
        order,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle sales order not found error
        if (error.message === 'Sales order not found') {
          res.status(404).json({
            error: 'Not found',
            message: error.message,
          });
          return;
        }

        // Handle locked order deletion prevention - Requirement 8.3
        if (error.message === 'Cannot delete locked sales order') {
          res.status(403).json({
            error: 'Forbidden',
            message: error.message,
          });
          return;
        }

        // Handle other errors
        res.status(500).json({
          error: 'Failed to delete sales order',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }
}
