import Joi from 'joi';

export const idParam = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID').required(),
});

export const createBody = Joi.object({
  bookId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid bookId').required(),
  // dueDate is sent as number of days in controller
  dueDate: Joi.number().integer().min(1).max(365).required(),
});
