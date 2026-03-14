"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const CommunityController = __importStar(require("../controllers/communityController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
const PostIdParam = zod_1.z.object({ id: zod_1.z.string().min(1) });
const CreatePostSchema = zod_1.z.object({
    category: zod_1.z.string().min(1).max(100),
    topic: zod_1.z.string().min(1).max(100),
    title: zod_1.z.string().min(3).max(300),
    content: zod_1.z.string().min(10).max(20000),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(10).default([]),
});
const UpdatePostSchema = CreatePostSchema.partial();
const CreateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
});
router.get('/forum/posts', CommunityController.listPosts);
router.post('/forum/posts', (0, validationMiddleware_1.validateBody)(CreatePostSchema), CommunityController.createPost);
router.put('/forum/posts/:id', (0, validationMiddleware_1.validateParams)(PostIdParam), (0, validationMiddleware_1.validateBody)(UpdatePostSchema), CommunityController.updatePost);
router.delete('/forum/posts/:id', (0, validationMiddleware_1.validateParams)(PostIdParam), CommunityController.deletePost);
router.get('/forum/posts/:id/comments', (0, validationMiddleware_1.validateParams)(PostIdParam), CommunityController.getComments);
router.post('/forum/posts/:id/comments', (0, validationMiddleware_1.validateParams)(PostIdParam), (0, validationMiddleware_1.validateBody)(CreateCommentSchema), CommunityController.createComment);
router.post('/forum/posts/:id/upvote', (0, validationMiddleware_1.validateParams)(PostIdParam), CommunityController.upvotePost);
router.post('/forum/posts/:id/downvote', (0, validationMiddleware_1.validateParams)(PostIdParam), CommunityController.downvotePost);
exports.default = router;
//# sourceMappingURL=community.js.map