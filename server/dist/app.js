import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./util/appStartup.util.js";
import routes from "./routes/index.routes.js";
// Load environment variables
dotenv.config();
const app = express();
// Middleware
if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is not defined in environment variables');
}
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Cookies:', req.headers.cookie);
    next();
});
// Custom JSON parser with better error handling
app.use((req, res, next) => {
    // Skip JSON parsing for multipart/form-data requests (file uploads)
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        return next();
    }
    express.json({
        limit: "10mb",
        verify: (req, res, buf, encoding) => {
            try {
                JSON.parse(buf.toString());
            }
            catch (err) {
                console.error("JSON Parse Error:", err.message);
                console.error("Request URL:", req.url);
                console.error("Request body:", buf.toString().substring(0, 200));
                throw new Error("Invalid JSON format");
            }
        }
    })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Routes
app.use("/api", routes);
// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error("Error occurred:", err.message);
    console.error("Stack trace:", err.stack);
    // Handle JSON parsing errors specifically
    if (err instanceof SyntaxError && err.message.includes("JSON")) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON format in request body",
            error: process.env.NODE_ENV === "development" ? err.message : "Bad Request"
        });
    }
    // Handle ApiError instances
    if (err.statusCode && err.message) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
    }
    // Handle other errors
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error"
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});
// Connect to database
connectDB();
export default app;
//# sourceMappingURL=app.js.map