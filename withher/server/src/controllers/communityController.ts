import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../utils/response';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { sanitizeText } from '../utils/sanitize';
import { BadgeService } from '../services/BadgeService';

// ─── GET /api/forum/posts ────────────────────────────────
export async function listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const { category, topic, tag } = req.query as { category?: string; topic?: string; tag?: string };

    const where = {
      status: 'PUBLISHED' as const,
      deletedAt: null,
      ...(category && { category }),
      ...(topic && { topic }),
      ...(tag && { tags: { has: tag } }),
    };

    const [posts, total] = await prisma.$transaction([
      prisma.forumPost.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          category: true,
          topic: true,
          title: true,
          tags: true,
          upvotes: true,
          downvotes: true,
          replyCount: true,
          isPinned: true,
          createdAt: true,
          author: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        },
      }),
      prisma.forumPost.count({ where }),
    ]);

    sendSuccess(res, posts, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/forum/posts ───────────────────────────────
export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, topic, title, content, tags } = req.body as {
      category: string; topic: string; title: string; content: string; tags: string[];
    };

    const post = await prisma.forumPost.create({
      data: {
        authorId: req.userId,
        category,
        topic,
        title: sanitizeText(title),
        content: sanitizeText(content),
        tags,
        status: 'PUBLISHED',
      },
    });

    await BadgeService.checkAfterPostCreated(req.userId);
    sendSuccess(res, post, 201);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/forum/posts/:id ────────────────────────────
export async function updatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
    if (!post) throw new NotFoundError('Post');
    if (post.authorId !== req.userId) throw new AuthorizationError('Not the post author');

    const { title, content, category, topic, tags } = req.body as Partial<{
      title: string; content: string; category: string; topic: string; tags: string[];
    }>;

    const updated = await prisma.forumPost.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title: sanitizeText(title) }),
        ...(content && { content: sanitizeText(content) }),
        ...(category && { category }),
        ...(topic && { topic }),
        ...(tags && { tags }),
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/forum/posts/:id ─────────────────────────
export async function deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
    if (!post) throw new NotFoundError('Post');
    if (post.authorId !== req.userId) throw new AuthorizationError('Not the post author');

    await prisma.forumPost.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    sendSuccess(res, { message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/forum/posts/:id/comments ──────────────────
export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const [comments, total] = await prisma.$transaction([
      prisma.forumComment.findMany({
        where: { postId: req.params.id, deletedAt: null },
        orderBy: [{ isMarkedHelpful: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          upvotes: true,
          isMarkedHelpful: true,
          createdAt: true,
          author: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        },
      }),
      prisma.forumComment.count({ where: { postId: req.params.id, deletedAt: null } }),
    ]);
    sendSuccess(res, comments, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/forum/posts/:id/comments ─────────────────
export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id, deletedAt: null } });
    if (!post) throw new NotFoundError('Post');

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.forumComment.create({
        data: { postId: req.params.id, authorId: req.userId, content: sanitizeText(req.body.content as string) },
      });
      await tx.forumPost.update({ where: { id: req.params.id }, data: { replyCount: { increment: 1 } } });
      return created;
    });

    sendSuccess(res, comment, 201);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/forum/posts/:id/upvote ───────────────────
export async function upvotePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await prisma.forumPost.update({
      where: { id: req.params.id, deletedAt: null },
      data: { upvotes: { increment: 1 } },
      select: { id: true, upvotes: true },
    });
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/forum/posts/:id/downvote ─────────────────
export async function downvotePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await prisma.forumPost.update({
      where: { id: req.params.id, deletedAt: null },
      data: { downvotes: { increment: 1 } },
      select: { id: true, downvotes: true },
    });
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}
