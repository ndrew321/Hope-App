/**
 * Centralised application error classes.
 * All errors thrown inside controllers/services extend AppError.
 * The global error handler in app.ts maps these to HTTP responses.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare class InternalError extends AppError {
    constructor(message?: string);
}
export declare class SafetyError extends AppError {
    constructor(message: string);
}
export declare class AgeRestrictionError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map