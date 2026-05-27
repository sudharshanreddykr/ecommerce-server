import { Op } from 'sequelize';
import Product from '../models/Product';
import User from '../models/User';
import { cacheService } from '../utils/cacheService';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

interface CreateProductDTO {
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  sku: string;
  userId: string;
}

interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  sku?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  userId?: string;
}

export class ProductService {
  private readonly CACHE_PREFIX = 'product:';
  private readonly CACHE_LIST_KEY = 'products:list';
  private readonly CACHE_TTL = 1800; // 30 minutes

  async createProduct(data: CreateProductDTO): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ where: { sku: data.sku } });
    if (existingProduct) {
      throw new ConflictError('Product with this SKU already exists');
    }

    // Verify user exists
    const user = await User.findByPk(data.userId);
    if (!user) {
      throw new NotFoundError('User', data.userId);
    }

    const product = await Product.create({
      name: data.name,
      description: data.description || null,
      price: data.price,
      quantity: data.quantity,
      sku: data.sku,
      userId: data.userId,
    });

    // Clear list cache
    await cacheService.delPattern(`${this.CACHE_LIST_KEY}:*`);

    logger.info(`Product created: ${product.id}`);
    return product;
  }

  async getProductById(id: string): Promise<Product | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const product = await Product.findByPk(id, {
          include: [
            { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
          ],
        });

        if (!product) {
          throw new NotFoundError('Product', id);
        }

        return product;
      },
      this.CACHE_TTL
    );
  }

  async getAllProducts(
    params: PaginationParams
  ): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, search, userId } = params;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
    };
  }

  async updateProduct(id: string, data: UpdateProductDTO, userId: string): Promise<Product> {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new NotFoundError('Product', id);
    }

    // Check ownership
    if (product.userId !== userId) {
      throw new ForbiddenError('You can only update your own products');
    }

    // Check SKU uniqueness if updating SKU
    if (data.sku && data.sku !== product.sku) {
      const existingProduct = await Product.findOne({ where: { sku: data.sku } });
      if (existingProduct) {
        throw new ConflictError('SKU already in use');
      }
    }

    await product.update(data);

    // Invalidate caches
    await cacheService.del(`${this.CACHE_PREFIX}${id}`);
    await cacheService.delPattern(`${this.CACHE_LIST_KEY}:*`);

    logger.info(`Product updated: ${id}`);
    return product;
  }

  async deleteProduct(id: string, userId: string): Promise<void> {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new NotFoundError('Product', id);
    }

    // Check ownership
    if (product.userId !== userId) {
      throw new ForbiddenError('You can only delete your own products');
    }

    await product.destroy();

    // Invalidate caches
    await cacheService.del(`${this.CACHE_PREFIX}${id}`);
    await cacheService.delPattern(`${this.CACHE_LIST_KEY}:*`);

    logger.info(`Product deleted: ${id}`);
  }

  async getProductsByUserId(userId: string): Promise<Product[]> {
    const products = await Product.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
    });

    return products;
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const products = await Product.findAll({
      where: {
        quantity: { [Op.lte]: threshold },
      },
      order: [['quantity', 'ASC']],
    });

    return products;
  }
}

export const productService = new ProductService();
