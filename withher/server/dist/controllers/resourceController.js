"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listResources = listResources;
exports.getResource = getResource;
exports.createResource = createResource;
exports.saveResource = saveResource;
exports.getSavedResources = getSavedResources;
exports.trackView = trackView;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
// ─── GET /api/resources ──────────────────────────────────
async function listResources(req, res, next) {
    try {
        const { page, limit, skip } = (0, response_1.parsePagination)(req.query.page, req.query.limit);
        const { type, level, topic } = req.query;
        const where = {
            approvedByAdmin: true,
            ...(type && { type: type }),
            ...(level && { levelTargeting: { has: level } }),
            ...(topic && { topicTags: { has: topic } }),
        };
        const [resources, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.resource.findMany({
                where,
                orderBy: { viewCount: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.resource.count({ where }),
        ]);
        (0, response_1.sendSuccess)(res, resources, 200, (0, response_1.buildPaginationMeta)(page, limit, total));
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/resources/:id ──────────────────────────────
async function getResource(req, res, next) {
    try {
        const resource = await prisma_1.prisma.resource.findUnique({ where: { id: req.params.id } });
        if (!resource)
            throw new errors_1.NotFoundError('Resource');
        (0, response_1.sendSuccess)(res, resource);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/resources ─────────────────────────────────
async function createResource(req, res, next) {
    try {
        const data = req.body;
        const resource = await prisma_1.prisma.resource.create({
            data: {
                type: data.type,
                title: data.title,
                description: data.description ?? null,
                authorOrCurator: data.authorOrCurator ?? null,
                urlOrFilePath: data.urlOrFilePath,
                category: data.category,
                levelTargeting: data.levelTargeting,
                topicTags: data.topicTags,
                approvedByAdmin: false, // Requires admin review before appearing in feed
            },
        });
        (0, response_1.sendSuccess)(res, resource, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/resources/:id/save ───────────────────────
async function saveResource(req, res, next) {
    try {
        const resource = await prisma_1.prisma.resource.findUnique({ where: { id: req.params.id } });
        if (!resource)
            throw new errors_1.NotFoundError('Resource');
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.savedResource.upsert({
                where: { userId_resourceId: { userId: req.userId, resourceId: req.params.id } },
                create: { userId: req.userId, resourceId: req.params.id },
                update: {},
            });
            await tx.resource.update({ where: { id: req.params.id }, data: { saveCount: { increment: 1 } } });
        });
        (0, response_1.sendSuccess)(res, { message: 'Resource saved' });
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/resources/saved ────────────────────────────
async function getSavedResources(req, res, next) {
    try {
        const { page, limit, skip } = (0, response_1.parsePagination)(req.query.page, req.query.limit);
        const [saved, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.savedResource.findMany({
                where: { userId: req.userId },
                include: { resource: true },
                orderBy: { savedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.savedResource.count({ where: { userId: req.userId } }),
        ]);
        (0, response_1.sendSuccess)(res, saved.map((s) => s.resource), 200, (0, response_1.buildPaginationMeta)(page, limit, total));
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/resources/:id/view ───────────────────────
async function trackView(req, res, next) {
    try {
        await prisma_1.prisma.resource.update({
            where: { id: req.params.id },
            data: { viewCount: { increment: 1 } },
        });
        (0, response_1.sendSuccess)(res, { message: 'View recorded' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=resourceController.js.map