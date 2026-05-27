import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/requestValidator';
import { productController } from '../controllers/productController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Create product
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 3, max: 255 }),
    body('description').optional().trim(),
    body('price').isFloat({ min: 0 }),
    body('quantity').isInt({ min: 0 }),
    body('sku').trim().notEmpty()
  ],
  handleValidationErrors,
  asyncHandler(productController.createProduct.bind(productController))
);

// Get all products
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
    query('userId').optional().isUUID()
  ],
  handleValidationErrors,
  asyncHandler(productController.getAllProducts.bind(productController))
);

// Get user's products
router.get(
  '/my-products',
  asyncHandler(productController.getMyProducts.bind(productController))
);

// Get low stock products
router.get(
  '/low-stock',
  [query('threshold').optional().isInt({ min: 0 }).toInt()],
  handleValidationErrors,
  asyncHandler(productController.getLowStockProducts.bind(productController))
);

// Get product by ID
router.get(
  '/:id',
  [param('id').isUUID()],
  handleValidationErrors,
  asyncHandler(productController.getProductById.bind(productController))
);

// Update product
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 3, max: 255 }),
    body('description').optional().trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('quantity').optional().isInt({ min: 0 }),
    body('sku').optional().trim().notEmpty()
  ],
  handleValidationErrors,
  asyncHandler(productController.updateProduct.bind(productController))
);

// Delete product
router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidationErrors,
  asyncHandler(productController.deleteProduct.bind(productController))
);

export default router;
