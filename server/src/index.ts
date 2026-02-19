import app from './app.js';
import dotenv from 'dotenv';
import logger from './util/logger.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 8000;

const startServer = (port: number) => {
  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 Server is running on port ${port}`);
    logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 API Base URL: http://localhost:${port}/api`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use. Please kill the process or use a different port.`);
    } else {
      logger.error('Server error', { error: err.message });
    }
    process.exit(1);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, closing server gracefully`);
    server.close((closeErr) => {
      if (closeErr) {
        logger.error('Error closing server', { error: closeErr.message });
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
};

// Start the server
try {
  startServer(PORT);

  // Keep the process alive in environments where the event loop might prematurely empty
  setInterval(() => {
    // Purposefully empty: keeps event loop busy
  }, 3600000).unref(); // Every hour, unref so it doesn't block graceful exit
} catch (err) {
  logger.error('Failed to start server', { error: (err as any).message });
  process.exit(1);
}
