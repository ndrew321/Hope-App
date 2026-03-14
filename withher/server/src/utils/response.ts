import { Response } from 'express';

// ─── Response shape interfaces ───────────────────────────

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

// ─── Helper functions ────────────────────────────────────

/**
 * Send a standardised JSON success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
): Response<SuccessResponse<T>> {
  const body: SuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Send a standardised JSON error response.
 */
export function sendError(
  res: Response,
  message: string,
  code: string,
  statusCode = 500,
): Response<ErrorResponse> {
  return res.status(statusCode).json({ success: false, error: message, code });
}

/**
 * Build pagination meta from query params + total count.
 */
export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parse and clamp pagination query params.
 */
export function parsePagination(
  rawPage: unknown,
  rawLimit: unknown,
  maxLimit = 100,
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(rawPage ?? '1'), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(rawLimit ?? '20'), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}
