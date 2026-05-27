import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { userService } from '../services/userService';
import { AppError } from '../utils/errors';
import { TokenService } from '../utils/tokenService';
import { logger } from '../utils/logger';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true',
  sameSite: 'none' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class UserController {
  async register(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
      } = req.body;

      const user = await userService.createUser({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
      });

      res.status(201).json({
        status: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          addressLine1: user.addressLine1,
          addressLine2: user.addressLine2,
          city: user.city,
          state: user.state,
          postalCode: user.postalCode,
          country: user.country,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await userService.validateUserCredentials(email, password);
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }
      logger.info(`User ${user} logged in successfully`);
      if (!user.isActive) {
        throw new AppError('User account is deactivated', 403);
      }

      const tokens = TokenService.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role as 'admin' | 'user',
      });

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      res.json({
        status: true,
        message: 'Login successful',
        data: {
          accessToken: tokens.accessToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            addressLine1: user.addressLine1,
            addressLine2: user.addressLine2,
            city: user.city,
            state: user.state,
            postalCode: user.postalCode,
            country: user.country,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await userService.getUserById(req.user!.id);

      res.json({
        status: true,
        message: 'Profile retrieved successfully',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.json({
        status: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await userService.getAllUsers({ page, limit, search });

      res.json({
        status: true,
        message: 'Users retrieved successfully',
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

  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Users can only update their own profile unless they're admin
      if (req.user!.role !== 'admin' && req.user!.id !== id) {
        throw new AppError('You can only update your own profile', 403);
      }

      const user = await userService.updateUser(id, updates);

      res.json({
        status: true,
        message: 'User updated successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          addressLine1: user.addressLine1,
          addressLine2: user.addressLine2,
          city: user.city,
          state: user.state,
          postalCode: user.postalCode,
          country: user.country,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Users can only delete their own account unless they're admin
      if (req.user!.role !== 'admin' && req.user!.id !== id) {
        throw new AppError('You can only delete your own account', 403);
      }

      await userService.deleteUser(id);

      res.json({
        status: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  async activateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.activateUser(id);

      res.json({
        status: true,
        message: 'User activated successfully',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  async deactivateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.deactivateUser(id);

      res.json({
        status: true,
        message: 'User deactivated successfully',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const userController = new UserController();
