import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/errors';

export const requestValidator = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: (err as any).path,
      message: err.msg,
      value: (err as any).value
    }));

    throw new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    );
  }

  next();
};

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(err => ({
        field: (err as any).path,
        message: err.msg
      })),
      timestamp: new Date().toISOString()
    });
  }

  next();
};
