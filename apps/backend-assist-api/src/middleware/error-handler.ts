import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle http-errors library errors
  if (createHttpError.isHttpError(err)) {
    logger.error({ err, path: req.path, statusCode: err.statusCode }, 'HTTP Error');
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Handle Mongoose validation errors
  if ((err as any).name === 'ValidationError') {
    logger.warn({ err }, 'Validation Error');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: [err.message]
    });
  }

  // Handle Mongoose duplicate key error
  if ((err as any).name === 'MongoError' && (err as any).code === 11000) {
    logger.warn({ err }, 'Duplicate key error');
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry detected'
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if ((err as any).name === 'CastError') {
    logger.warn({ err }, 'Cast Error');
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }

  // Default server error
  logger.error({ err, path: req.path }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
