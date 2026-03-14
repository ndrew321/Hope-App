import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import * as CommunityController from '../controllers/communityController';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const PostIdParam = z.object({ id: z.string().min(1) });

const CreatePostSchema = z.object({
  category: z.string().min(1).max(100),
  topic: z.string().min(1).max(100),
  title: z.string().min(3).max(300),
  content: z.string().min(10).max(20000),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

const UpdatePostSchema = CreatePostSchema.partial();

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

router.get('/forum/posts', CommunityController.listPosts);
router.post('/forum/posts', validateBody(CreatePostSchema), CommunityController.createPost);
router.put('/forum/posts/:id', validateParams(PostIdParam), validateBody(UpdatePostSchema), CommunityController.updatePost);
router.delete('/forum/posts/:id', validateParams(PostIdParam), CommunityController.deletePost);
router.get('/forum/posts/:id/comments', validateParams(PostIdParam), CommunityController.getComments);
router.post('/forum/posts/:id/comments', validateParams(PostIdParam), validateBody(CreateCommentSchema), CommunityController.createComment);
router.post('/forum/posts/:id/upvote', validateParams(PostIdParam), CommunityController.upvotePost);
router.post('/forum/posts/:id/downvote', validateParams(PostIdParam), CommunityController.downvotePost);

export default router;
