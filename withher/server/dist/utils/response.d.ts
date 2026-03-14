import { Response } from 'express';
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: PaginationMeta;
}
export interface ErrorResponse {
    success: false;
    error: string;
    code: string;
}
/**
 * Send a standardised JSON success response.
 */
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, meta?: PaginationMeta): Response<SuccessResponse<T>>;
/**
 * Send a standardised JSON error response.
 */
export declare function sendError(res: Response, message: string, code: string, statusCode?: number): Response<ErrorResponse>;
/**
 * Build pagination meta from query params + total count.
 */
export declare function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta;
/**
 * Parse and clamp pagination query params.
 */
export declare function parsePagination(rawPage: unknown, rawLimit: unknown, maxLimit?: number): {
    page: number;
    limit: number;
    skip: number;
};
//# sourceMappingURL=response.d.ts.map