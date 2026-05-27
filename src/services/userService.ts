import { Op } from 'sequelize';
import User from '../models/User';
import { cacheService } from '../utils/cacheService';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}

interface UpdateUserDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  role?: 'admin' | 'user';
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export class UserService {
  private readonly CACHE_PREFIX = 'user:';
  private readonly CACHE_LIST_KEY = 'users:list';
  private readonly CACHE_TTL = 3600; // 1 hour

  async createUser(data: CreateUserDTO): Promise<User> {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      role: data.role || 'user',
      isActive: data.isActive !== false,
    });

    // Clear list cache
    await cacheService.delPattern(`${this.CACHE_LIST_KEY}:*`);

    logger.info(`User created: ${user.id}`);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await User.findByPk(id, {
          attributes: { exclude: ['password'] },
        });

        if (!user) {
          throw new NotFoundError('User', id);
        }

        return user;
      },
      this.CACHE_TTL
    );
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await User.findOne({ where: { email } });
    return user;
  }

  async getAllUsers(
    params: PaginationParams
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
    };
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    // Check email uniqueness if updating email
    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }
    }

    await user.update(data);

    // Invalidate caches
    await cacheService.del(`${this.CACHE_PREFIX}${id}`);
    await cacheService.delPattern(`${this.CACHE_LIST_KEY}:*`);

    logger.info(`User updated: ${id}`);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    await user.destroy();

    // Invalidate caches
    await cacheService.del(`${this.CACHE_PREFIX}${id}`);
    await cacheService.delPattern(`${this.CACHE_LIST_KEY}:*`);

    logger.info(`User deleted: ${id}`);
  }

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async activateUser(id: string): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    await user.update({ isActive: true });
    await cacheService.del(`${this.CACHE_PREFIX}${id}`);

    return user;
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    await user.update({ isActive: false });
    await cacheService.del(`${this.CACHE_PREFIX}${id}`);

    return user;
  }
}

export const userService = new UserService();
