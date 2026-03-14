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
const ResourceController = __importStar(require("../controllers/resourceController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
const ResourceIdParam = zod_1.z.object({ id: zod_1.z.string().min(1) });
const CreateResourceSchema = zod_1.z.object({
    type: zod_1.z.enum(['ARTICLE', 'VIDEO', 'GUIDE', 'BOOK', 'COURSE', 'TOOL']),
    title: zod_1.z.string().min(3).max(300),
    description: zod_1.z.string().max(3000).optional(),
    authorOrCurator: zod_1.z.string().max(200).optional(),
    urlOrFilePath: zod_1.z.string().url(),
    category: zod_1.z.array(zod_1.z.string()).default([]),
    levelTargeting: zod_1.z.array(zod_1.z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'])).default([]),
    topicTags: zod_1.z.array(zod_1.z.string()).default([]),
});
router.get('/', ResourceController.listResources);
router.get('/saved', ResourceController.getSavedResources);
router.get('/:id', (0, validationMiddleware_1.validateParams)(ResourceIdParam), ResourceController.getResource);
router.post('/', (0, validationMiddleware_1.validateBody)(CreateResourceSchema), ResourceController.createResource);
router.post('/:id/save', (0, validationMiddleware_1.validateParams)(ResourceIdParam), ResourceController.saveResource);
router.post('/:id/view', (0, validationMiddleware_1.validateParams)(ResourceIdParam), ResourceController.trackView);
exports.default = router;
//# sourceMappingURL=resources.js.map