import Joi from 'joi';

export const idParam = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID').required(),
});

export const listQuery = Joi.object({
  q: Joi.string().trim().max(200).optional(),
  authors: Joi.string().trim().max(200).optional(),
  category: Joi.string().trim().max(100).optional(),
  available: Joi.string().valid('true', 'false').optional(),
});

export const searchQuery = Joi.object({
  q: Joi.string().trim().min(1).max(200).required(),
});

export const createBody = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  authors: Joi.string().trim().min(1).max(500).required(), // Tăng lên 500 để chứa nhiều authors
  category: Joi.string().trim().max(100).allow('').optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  thumbnail: Joi.string().uri().allow(null, '').optional(), // URL when using Google Books
}).unknown(true); // allow multipart fields

export const updateBody = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  authors: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(2000).optional(),
  available: Joi.boolean().optional(),
  categories: Joi.array().items(Joi.string().trim().max(100)).optional(),
  thumbnailUrl: Joi.string().uri().optional(),
}).min(1);
