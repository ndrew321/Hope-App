"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPosts = listPosts;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.getComments = getComments;
exports.createComment = createComment;
exports.upvotePost = upvotePost;
exports.downvotePost = downvotePost;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const sanitize_1 = require("../utils/sanitize");
const BadgeService_1 = require("../services/BadgeService");
// ─── GET /api/forum/posts ────────────────────────────────
async function listPosts(req, res, next) {
    try {
        const { page, limit, skip } = (0, response_1.parsePagination)(req.query.page, req.query.limit);
        const { category, topic, tag } = req.query;
        const where = {
            status: 'PUBLISHED',
            deletedAt: null,
            ...(category && { category }),
            ...(topic && { topic }),
            ...(tag && { tags: { has: tag } }),
        };
        const [posts, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.forumPost.findMany({
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
            prisma_1.prisma.forumPost.count({ where }),
        ]);
        (0, response_1.sendSuccess)(res, posts, 200, (0, response_1.buildPaginationMeta)(page, limit, total));
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/forum/posts ───────────────────────────────
async function createPost(req, res, next) {
    try {
        const { category, topic, title, content, tags } = req.body;
        const post = await prisma_1.prisma.forumPost.create({
            data: {
                authorId: req.userId,
                category,
                topic,
                title: (0, sanitize_1.sanitizeText)(title),
                content: (0, sanitize_1.sanitizeText)(content),
                tags,
                status: 'PUBLISHED',
            },
        });
        await BadgeService_1.BadgeService.checkAfterPostCreated(req.userId);
        (0, response_1.sendSuccess)(res, post, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── PUT /api/forum/posts/:id ────────────────────────────
async function updatePost(req, res, next) {
    try {
        const post = await prisma_1.prisma.forumPost.findUnique({ where: { id: req.params.id } });
        if (!post)
            throw new errors_1.NotFoundError('Post');
        if (post.authorId !== req.userId)
            throw new errors_1.AuthorizationError('Not the post author');
        const { title, content, category, topic, tags } = req.body;
        const updated = await prisma_1.prisma.forumPost.update({
            where: { id: req.params.id },
            data: {
                ...(title && { title: (0, sanitize_1.sanitizeText)(title) }),
                ...(content && { content: (0, sanitize_1.sanitizeText)(content) }),
                ...(category && { category }),
                ...(topic && { topic }),
                ...(tags && { tags }),
            },
        });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
// ─── DELETE /api/forum/posts/:id ─────────────────────────
async function deletePost(req, res, next) {
    try {
        const post = await prisma_1.prisma.forumPost.findUnique({ where: { id: req.params.id } });
        if (!post)
            throw new errors_1.NotFoundError('Post');
        if (post.authorId !== req.userId)
            throw new errors_1.AuthorizationError('Not the post author');
        await prisma_1.prisma.forumPost.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
        (0, response_1.sendSuccess)(res, { message: 'Post deleted' });
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/forum/posts/:id/comments ──────────────────
async function getComments(req, res, next) {
    try {
        const { page, limit, skip } = (0, response_1.parsePagination)(req.query.page, req.query.limit);
        const [comments, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.forumComment.findMany({
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
            prisma_1.prisma.forumComment.count({ where: { postId: req.params.id, deletedAt: null } }),
        ]);
        (0, response_1.sendSuccess)(res, comments, 200, (0, response_1.buildPaginationMeta)(page, limit, total));
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/forum/posts/:id/comments ─────────────────
async function createComment(req, res, next) {
    try {
        const post = await prisma_1.prisma.forumPost.findUnique({ where: { id: req.params.id, deletedAt: null } });
        if (!post)
            throw new errors_1.NotFoundError('Post');
        const comment = await prisma_1.prisma.$transaction(async (tx) => {
            const created = await tx.forumComment.create({
                data: { postId: req.params.id, authorId: req.userId, content: (0, sanitize_1.sanitizeText)(req.body.content) },
            });
            await tx.forumPost.update({ where: { id: req.params.id }, data: { replyCount: { increment: 1 } } });
            return created;
        });
        (0, response_1.sendSuccess)(res, comment, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/forum/posts/:id/upvote ───────────────────
async function upvotePost(req, res, next) {
    try {
        const updated = await prisma_1.prisma.forumPost.update({
            where: { id: req.params.id, deletedAt: null },
            data: { upvotes: { increment: 1 } },
            select: { id: true, upvotes: true },
        });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/forum/posts/:id/downvote ─────────────────
async function downvotePost(req, res, next) {
    try {
        const updated = await prisma_1.prisma.forumPost.update({
            where: { id: req.params.id, deletedAt: null },
            data: { downvotes: { increment: 1 } },
            select: { id: true, downvotes: true },
        });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=communityController.js.map