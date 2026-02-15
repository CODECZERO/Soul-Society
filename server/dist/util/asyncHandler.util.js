import { ApiError } from './apiError.util.js';
const AsyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((error) => {
            // Log the error for debugging purposes
            console.error(error);
            const errorData = {
                timestamp: new Date(),
                message: error.message,
                stack: error.stack,
                // Add other relevant error details
            };
            // Handle specific error types if needed
            if (error instanceof ApiError) {
                return next(error); // Pass ApiError to error middleware
            }
            // Create a generic error response
            const apiError = new ApiError(500, 'Internal Server Error');
            next(apiError);
        });
    };
};
export default AsyncHandler;
//# sourceMappingURL=asyncHandler.util.js.map