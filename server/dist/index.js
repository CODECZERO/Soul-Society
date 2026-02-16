import app from './app.js';
import dotenv from 'dotenv';
import logger from './util/logger.js';
// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 API Base URL: http://localhost:${PORT}/api`);
});
//# sourceMappingURL=index.js.map