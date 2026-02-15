declare class ApiError extends Error {
    statusCode: number;
    data: any;
    success: boolean;
    errors: unknown[];
    constructor(statusCode?: number, message?: any, errors?: unknown[], stack?: string);
}
export { ApiError };
//# sourceMappingURL=apiError.util.d.ts.map