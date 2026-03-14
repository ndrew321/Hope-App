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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const underage18Middleware_1 = require("../middleware/underage18Middleware");
const UserController = __importStar(require("../controllers/userController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
// ─── Zod Schemas ──────────────────────────────────────────
const IdParamSchema = zod_1.z.object({ id: zod_1.z.string().min(1) });
const UpdateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    phone: zod_1.z.string().optional(),
    location: zod_1.z.string().max(200).optional(),
    bio: zod_1.z.string().max(2000).optional(),
    gender: zod_1.z.string().max(50).optional(),
});
const UpdateProfileSchema = zod_1.z.object({
    currentLevel: zod_1.z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM']).optional(),
    positions: zod_1.z.array(zod_1.z.string()).optional(),
    yearsExperience: zod_1.z.number().int().min(0).max(50).optional(),
    clubsTeams: zod_1.z.array(zod_1.z.string()).optional(),
    specializedPrograms: zod_1.z.array(zod_1.z.string()).optional(),
    mentorshipRole: zod_1.z.enum(['MENTOR', 'MENTEE', 'BOTH']).optional(),
    mentorshipGoals: zod_1.z.string().max(3000).optional(),
    careerGoals: zod_1.z.string().max(3000).optional(),
    communicationStyle: zod_1.z.string().max(200).optional(),
    personalityTraits: zod_1.z.array(zod_1.z.string()).optional(),
    bipocIdentification: zod_1.z.boolean().optional(),
    lgbtqIdentification: zod_1.z.boolean().optional(),
    interestsOutsideSoccer: zod_1.z.array(zod_1.z.string()).optional(),
});
const UpdatePreferencesSchema = zod_1.z.object({
    preferredMentorLevels: zod_1.z.array(zod_1.z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'])).optional(),
    preferredMenteeLevels: zod_1.z.array(zod_1.z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'])).optional(),
    geographicPreference: zod_1.z.string().max(200).optional(),
    maxDistanceKm: zod_1.z.number().int().min(0).max(20000).optional(),
    availabilityHoursPerWeek: zod_1.z.number().int().min(0).max(40).optional(),
    timezone: zod_1.z.string().max(60).optional(),
    communicationPreference: zod_1.z.enum(['SYNC', 'ASYNC', 'BOTH']).optional(),
});
// ─── All user routes require auth ─────────────────────────
router.use(authMiddleware_1.authMiddleware);
router.use(underage18Middleware_1.underage18Middleware);
router.get('/:id', (0, validationMiddleware_1.validateParams)(IdParamSchema), UserController.getUser);
router.put('/:id', (0, validationMiddleware_1.validateParams)(IdParamSchema), (0, validationMiddleware_1.validateBody)(UpdateUserSchema), UserController.updateUser);
router.get('/:id/full-profile', (0, validationMiddleware_1.validateParams)(IdParamSchema), UserController.getFullProfile);
router.post('/:id/profile-photo', (0, validationMiddleware_1.validateParams)(IdParamSchema), upload.single('photo'), UserController.uploadProfilePhoto);
router.get('/:id/preferences', (0, validationMiddleware_1.validateParams)(IdParamSchema), UserController.getPreferences);
router.put('/:id/preferences', (0, validationMiddleware_1.validateParams)(IdParamSchema), (0, validationMiddleware_1.validateBody)(UpdatePreferencesSchema), UserController.updatePreferences);
router.put('/:id/profile', (0, validationMiddleware_1.validateParams)(IdParamSchema), (0, validationMiddleware_1.validateBody)(UpdateProfileSchema), UserController.updateProfile);
router.delete('/:id', (0, validationMiddleware_1.validateParams)(IdParamSchema), UserController.softDeleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map