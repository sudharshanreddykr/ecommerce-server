import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/requestValidator';
import { asyncHandler } from '../utils/asyncHandler';
import { commerceController } from '../controllers/commerceController';

const router = Router();

router.use(authenticate);

router.post(
  '/cart-events',
  [
    body('productId').isUUID(),
    body('productName').trim().notEmpty(),
    body('quantity').isInt({ min: 1 }).toInt(),
  ],
  handleValidationErrors,
  asyncHandler(commerceController.recordCartEvent.bind(commerceController))
);

router.post(
  '/holds',
  [body('items').isArray({ min: 1 }), body('items.*.productId').isUUID(), body('items.*.quantity').isInt({ min: 1 }).toInt()],
  handleValidationErrors,
  asyncHandler(commerceController.acquireHold.bind(commerceController))
);

router.get('/holds/me', asyncHandler(commerceController.getMyHold.bind(commerceController)));
router.delete('/holds/me', asyncHandler(commerceController.releaseMyHold.bind(commerceController)));
router.get('/orders/my', asyncHandler(commerceController.getMyOrders.bind(commerceController)));

router.post(
  '/orders',
  [
    body('status').isIn(['processing', 'paid', 'shipped']),
    body('total').isFloat({ min: 0 }),
    body('itemCount').isInt({ min: 1 }).toInt(),
    body('items').isArray({ min: 1 }),
    body('paymentMethod').isIn(['dummy-card', 'cash-on-delivery']),
  ],
  handleValidationErrors,
  asyncHandler(commerceController.createOrder.bind(commerceController))
);

router.get(
  '/orders',
  authorize('admin'),
  asyncHandler(commerceController.getAllOrders.bind(commerceController))
);
router.get(
  '/cart-events',
  authorize('admin'),
  asyncHandler(commerceController.getAllCartEvents.bind(commerceController))
);
router.get(
  '/holds',
  authorize('admin'),
  asyncHandler(commerceController.getAllHolds.bind(commerceController))
);

export default router;
