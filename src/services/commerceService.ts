import { Transaction } from 'sequelize';
import sequelize from '../config/database';
import redis from '../config/redis';
import Product from '../models/Product';
import { AppError, ConflictError, NotFoundError, ValidationError } from '../utils/errors';

export interface CartEventRecord {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  createdAt: string;
}

export interface CheckoutHoldItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface CheckoutHoldRecord {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  items: CheckoutHoldItem[];
}

export interface CommerceOrderRecord {
  id: string;
  userId: string;
  status: 'processing' | 'paid' | 'shipped';
  placedAt: string;
  total: number;
  itemCount: number;
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    email: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    deliveryInstructions: string;
  };
  paymentMethod: 'dummy-card' | 'cash-on-delivery';
}

const CART_EVENTS_KEY = 'commerce:cart-events';
const HOLD_KEY_PREFIX = 'commerce:hold:';
const USER_HOLD_KEY_PREFIX = 'commerce:user-hold:';
const ORDERS_KEY = 'commerce:orders';
const HOLD_TTL_SECONDS = 120;

export class CommerceService {
  async recordCartEvent(event: Omit<CartEventRecord, 'id' | 'createdAt'>) {
    const record: CartEventRecord = {
      id: `CE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...event,
    };

    await redis.lpush(CART_EVENTS_KEY, JSON.stringify(record));
    await redis.ltrim(CART_EVENTS_KEY, 0, 499);
    return record;
  }

  async getCartEvents() {
    const entries = await redis.lrange(CART_EVENTS_KEY, 0, 199);
    return entries.map((entry) => JSON.parse(entry) as CartEventRecord);
  }

  private async getHoldKeys() {
    return redis.keys(`${HOLD_KEY_PREFIX}*`);
  }

  async getActiveHolds() {
    const keys = await this.getHoldKeys();
    if (keys.length === 0) {
      return [];
    }

    const values = await redis.mget(keys);
    return values
      .filter(Boolean)
      .map((value) => JSON.parse(value as string) as CheckoutHoldRecord)
      .sort(
        (left, right) =>
          new Date(left.expiresAt).getTime() - new Date(right.expiresAt).getTime()
      );
  }

  async getHoldForUser(userId: string) {
    const holdId = await redis.get(`${USER_HOLD_KEY_PREFIX}${userId}`);
    if (!holdId) {
      return null;
    }

    const value = await redis.get(`${HOLD_KEY_PREFIX}${holdId}`);
    if (!value) {
      await redis.del(`${USER_HOLD_KEY_PREFIX}${userId}`);
      return null;
    }

    return JSON.parse(value) as CheckoutHoldRecord;
  }

  private async getHeldQuantity(productId: string, excludeHoldId?: string) {
    const holds = await this.getActiveHolds();
    return holds.reduce((sum, hold) => {
      if (excludeHoldId && hold.id === excludeHoldId) {
        return sum;
      }

      const item = hold.items.find((entry) => entry.productId === productId);
      return sum + (item?.quantity ?? 0);
    }, 0);
  }

  async releaseHoldForUser(userId: string) {
    const holdId = await redis.get(`${USER_HOLD_KEY_PREFIX}${userId}`);
    if (!holdId) {
      return;
    }

    await redis.del(`${USER_HOLD_KEY_PREFIX}${userId}`, `${HOLD_KEY_PREFIX}${holdId}`);
  }

  async acquireHold(
    userId: string,
    items: Array<{ productId: string; quantity: number }>
  ): Promise<CheckoutHoldRecord> {
    if (items.length === 0) {
      throw new ValidationError('No items supplied for checkout hold');
    }

    await this.releaseHoldForUser(userId);

    const validatedItems: CheckoutHoldItem[] = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        throw new NotFoundError('Product', item.productId);
      }

      const heldByOthers = await this.getHeldQuantity(item.productId);
      const available = Math.max(product.quantity - heldByOthers, 0);
      if (item.quantity > available) {
        throw new ConflictError(`${product.name} only has ${available} available`);
      }

      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
      });
    }

    const hold: CheckoutHoldRecord = {
      id: `HOLD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + HOLD_TTL_SECONDS * 1000).toISOString(),
      items: validatedItems,
    };

    await redis.setex(`${HOLD_KEY_PREFIX}${hold.id}`, HOLD_TTL_SECONDS, JSON.stringify(hold));
    await redis.setex(`${USER_HOLD_KEY_PREFIX}${userId}`, HOLD_TTL_SECONDS, hold.id);
    return hold;
  }

  async getAllOrders() {
    const entries = await redis.lrange(ORDERS_KEY, 0, 499);
    return entries.map((entry) => JSON.parse(entry) as CommerceOrderRecord);
  }

  async getOrdersForUser(userId: string) {
    const orders = await this.getAllOrders();
    return orders.filter((order) => order.userId === userId);
  }

  async createOrder(
    userId: string,
    payload: Omit<CommerceOrderRecord, 'id' | 'placedAt' | 'userId'>
  ) {
    const hold = await this.getHoldForUser(userId);
    if (!hold) {
      throw new AppError('Checkout hold has expired. Please retry from cart.', 409, 'HOLD_EXPIRED');
    }

    if (hold.items.length !== payload.items.length) {
      throw new ConflictError('Checkout items do not match the active reservation');
    }

    await sequelize.transaction(async (transaction: Transaction) => {
      for (const holdItem of hold.items) {
        const product = await Product.findByPk(holdItem.productId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!product) {
          throw new NotFoundError('Product', holdItem.productId);
        }

        if (product.quantity < holdItem.quantity) {
          throw new ConflictError(`${product.name} no longer has enough stock`);
        }

        await product.update(
          { quantity: product.quantity - holdItem.quantity },
          { transaction }
        );
      }
    });

    const order: CommerceOrderRecord = {
      id: `ORD-${Date.now().toString().slice(-8)}`,
      userId,
      placedAt: new Date().toISOString(),
      ...payload,
    };

    await redis.lpush(ORDERS_KEY, JSON.stringify(order));
    await this.releaseHoldForUser(userId);
    return order;
  }

  async decorateProduct<T extends { id: string; quantity: number }>(product: T, userId?: string) {
    const activeHold = userId ? await this.getHoldForUser(userId) : null;
    const heldQuantity = await this.getHeldQuantity(product.id, activeHold?.id);
    const availableQuantity = Math.max(product.quantity - heldQuantity, 0);

    return {
      ...product,
      heldQuantity,
      availableQuantity,
      soldQuantity: 0,
      isOutOfStock: availableQuantity <= 0,
    };
  }

  async decorateProducts<T extends { id: string; quantity: number }>(products: T[], userId?: string) {
    return Promise.all(products.map((product) => this.decorateProduct(product, userId)));
  }
}

export const commerceService = new CommerceService();
