import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { TokenService } from '../utils/tokenService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const headerToken = req.headers.authorization?.split(' ')[1];
    const token = (req.headers['x-access-token'] as string) || headerToken;

    if (!token) {
      throw new AppError('Authorization token is missing', 401);
    }

    const decoded = TokenService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    next(new AppError(message, 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
