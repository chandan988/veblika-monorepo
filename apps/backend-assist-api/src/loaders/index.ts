import { Express } from 'express';
import { connectDatabase } from '../config/database';
import { expressLoader } from './express';
import { routesLoader } from './routes';
import { logger } from '../config/logger';

export const initializeLoaders = async (app: Express): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✅ Database loader initialized');

    // Load Express middleware
    expressLoader(app);
    logger.info('✅ Express loader initialized');

    // Load routes
    routesLoader(app);
    logger.info('✅ Routes loader initialized');

    logger.info('🚀 All loaders initialized successfully');
  } catch (error) {
    logger.error('❌ Error initializing loaders:', error);
    throw error;
  }
};
