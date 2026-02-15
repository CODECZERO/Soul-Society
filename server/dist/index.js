import app from "./app.js";
import dotenv from "dotenv";
// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});
//# sourceMappingURL=index.js.map