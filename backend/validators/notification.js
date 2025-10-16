import Joi from 'joi';

export const idParam = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID').required(),
});

export const listQuery = Joi.object({
  unreadOnly: Joi.string().valid('true', 'false').optional(),
});
