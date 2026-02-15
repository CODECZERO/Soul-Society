class ApiError extends Error {
    statusCode;
    data;
    success;
    errors;
    constructor(statusCode = 500, message = "something went wrong", errors = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.data = message;
        this.message = message ? message : null;
        this.success = false;
        this.errors = errors;
        stack ? this.stack = stack : Error.captureStackTrace(this, this.constructor);
    }
}
export { ApiError };
//# sourceMappingURL=apiError.util.js.map