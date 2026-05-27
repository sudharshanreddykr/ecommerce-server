import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: false,
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }

  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      status: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: (error as any).errors?.map((e: any) => ({
        field: e.path,
        message: e.message
      })) || [],
      timestamp: new Date().toISOString()
    });
  }

  // Unhandled errors
  res.status(500).json({
    status: false,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
};
