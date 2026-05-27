import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/requestValidator';
import { userController } from '../controllers/userController';
import { authController } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// OAuth redirect routes
router.get('/auth/google', asyncHandler(authController.redirectGoogle.bind(authController)));
router.get(
  '/auth/google/callback',
  asyncHandler(authController.handleGoogleCallback.bind(authController))
);
router.get('/auth/github', asyncHandler(authController.redirectGithub.bind(authController)));
router.get(
  '/auth/github/callback',
  asyncHandler(authController.handleGithubCallback.bind(authController))
);

// Public routes
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().isLength({ min: 2 }),
    body('lastName').trim().isLength({ min: 2 }),
  ],
  handleValidationErrors,
  asyncHandler(userController.register.bind(userController))
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  handleValidationErrors,
  asyncHandler(userController.login.bind(userController))
);

router.post(
  '/refresh-token',
  [body('refreshToken').optional()],
  handleValidationErrors,
  asyncHandler(authController.refreshToken.bind(authController))
);

router.post(
  '/logout',
  asyncHandler(authController.logout.bind(authController))
);

// Protected routes
router.get('/profile', authenticate, asyncHandler(userController.getProfile.bind(userController)));

router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
  ],
  handleValidationErrors,
  asyncHandler(userController.getAllUsers.bind(userController))
);

router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  handleValidationErrors,
  asyncHandler(userController.getUserById.bind(userController))
);

router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().trim().isLength({ min: 2 }),
    body('lastName').optional().trim().isLength({ min: 2 }),
    body('password').optional().isLength({ min: 8 }),
  ],
  handleValidationErrors,
  asyncHandler(userController.updateUser.bind(userController))
);

router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  handleValidationErrors,
  asyncHandler(userController.deleteUser.bind(userController))
);

// Admin only routes
router.patch(
  '/:id/activate',
  authenticate,
  authorize('admin'),
  [param('id').isUUID()],
  handleValidationErrors,
  asyncHandler(userController.activateUser.bind(userController))
);

router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('admin'),
  [param('id').isUUID()],
  handleValidationErrors,
  asyncHandler(userController.deactivateUser.bind(userController))
);

export default router;
