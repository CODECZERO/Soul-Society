import app from './app.js';
import dotenv from 'dotenv';
import logger from './util/logger.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 8000;

/** Start the server and return the HTTP server for graceful close. */
function startServer(port: number = PORT) {
  const server = app.listen(port, () => {
    logger.info(`🚀 Server is running on port ${port}`);
    logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 API Base URL: http://localhost:${port}/api`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, closing server gracefully`);
    server.close((err) => {
      if (err) {
        logger.error('Error closing server', { error: err.message });
        process.exit(1);
      }
      logger.info('Server closed');
      process.exit(0);
    });
    // Force exit if graceful close takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

const server = startServer();
export { startServer, server };
