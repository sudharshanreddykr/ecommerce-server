import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { productService } from '../services/productService';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class ProductController {
  async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, price, quantity, sku } = req.body;

      const product = await productService.createProduct({
        name,
        description,
        price,
        quantity,
        sku,
        userId: req.user!.id,
      });

      res.status(201).json({
        status: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      throw error;
    }
  }

  async getProductById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.json({
        status: true,
        message: 'Product retrieved successfully',
        data: product,
      });
    } catch (error) {
      throw error;
    }
  }

  async getAllProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const userId = req.query.userId as string;

      const result = await productService.getAllProducts({
        page,
        limit,
        search,
        userId,
      });

      res.json({
        status: true,
        message: 'Products retrieved successfully',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const product = await productService.updateProduct(id, updates, req.user!.id);

      res.json({
        status: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      await productService.deleteProduct(id, req.user!.id);

      res.json({
        status: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  async getMyProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Authenticated user not found', 401);
      }

      const products = await productService.getProductsByUserId(userId);

      res.json({
        status: true,
        message: 'Your products retrieved successfully',
        data: products,
      });
    } catch (error) {
      throw error;
    }
  }

  async getLowStockProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;

      const products = await productService.getLowStockProducts(threshold);

      res.json({
        status: true,
        message: 'Low stock products retrieved successfully',
        data: products,
        count: products.length,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const productController = new ProductController();
