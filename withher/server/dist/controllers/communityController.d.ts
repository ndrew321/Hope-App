import { Request, Response, NextFunction } from 'express';
export declare function listPosts(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createPost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updatePost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deletePost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getComments(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createComment(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function upvotePost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function downvotePost(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=communityController.d.ts.map