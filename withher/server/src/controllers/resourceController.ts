import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../utils/response';
import { NotFoundError } from '../utils/errors';

// ─── GET /api/resources ──────────────────────────────────
export async function listResources(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const { type, level, topic } = req.query as { type?: string; level?: string; topic?: string };

    const where = {
      approvedByAdmin: true,
      ...(type && { type: type as never }),
      ...(level && { levelTargeting: { has: level as never } }),
      ...(topic && { topicTags: { has: topic } }),
    };

    const [resources, total] = await prisma.$transaction([
      prisma.resource.findMany({
        where,
        orderBy: { viewCount: 'desc' },
        skip,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    sendSuccess(res, resources, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/resources/:id ──────────────────────────────
export async function getResource(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!resource) throw new NotFoundError('Resource');
    sendSuccess(res, resource);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/resources ─────────────────────────────────
export async function createResource(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as {
      type: 'ARTICLE' | 'VIDEO' | 'GUIDE' | 'BOOK' | 'COURSE' | 'TOOL';
      title: string; description?: string; authorOrCurator?: string;
      urlOrFilePath: string; category: string[]; levelTargeting: string[]; topicTags: string[];
    };

    const resource = await prisma.resource.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        authorOrCurator: data.authorOrCurator ?? null,
        urlOrFilePath: data.urlOrFilePath,
        category: data.category,
        levelTargeting: data.levelTargeting as never,
        topicTags: data.topicTags,
        approvedByAdmin: false, // Requires admin review before appearing in feed
      },
    });

    sendSuccess(res, resource, 201);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/resources/:id/save ───────────────────────
export async function saveResource(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!resource) throw new NotFoundError('Resource');

    await prisma.$transaction(async (tx) => {
      await tx.savedResource.upsert({
        where: { userId_resourceId: { userId: req.userId, resourceId: req.params.id } },
        create: { userId: req.userId, resourceId: req.params.id },
        update: {},
      });
      await tx.resource.update({ where: { id: req.params.id }, data: { saveCount: { increment: 1 } } });
    });

    sendSuccess(res, { message: 'Resource saved' });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/resources/saved ────────────────────────────
export async function getSavedResources(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

    const [saved, total] = await prisma.$transaction([
      prisma.savedResource.findMany({
        where: { userId: req.userId },
        include: { resource: true },
        orderBy: { savedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.savedResource.count({ where: { userId: req.userId } }),
    ]);

    sendSuccess(res, saved.map((s) => s.resource), 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/resources/:id/view ───────────────────────
export async function trackView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.resource.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });
    sendSuccess(res, { message: 'View recorded' });
  } catch (err) {
    next(err);
  }
}
