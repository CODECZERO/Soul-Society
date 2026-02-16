import mongoose from 'mongoose';
export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('MONGODB_URI is not defined in environment variables');
            return;
        }
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        // Removed process.exit(1) to allow server to start even if DB is down
        // It will return 500 JSON errors for DB-dependent routes instead of being unreachable
    }
};
export const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected successfully');
    }
    catch (error) {
        console.error('MongoDB disconnection error:', error);
    }
};
//# sourceMappingURL=appStartup.util.js.map