import Joi from 'joi';

// User Validation Schemas
export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required()
});

export const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  password: Joi.string().min(8),
  role: Joi.string().valid('admin', 'user')
}).min(1);

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Product Validation Schemas
export const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow(''),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(0).required(),
  sku: Joi.string().required()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  description: Joi.string().allow(''),
  price: Joi.number().positive(),
  quantity: Joi.number().integer().min(0),
  sku: Joi.string()
}).min(1);

// Pagination Validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().pattern(/^-?[\w,]+$/),
  search: Joi.string()
});
