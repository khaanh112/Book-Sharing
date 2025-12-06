import Joi from 'joi';

export const registerBody = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

export const loginBody = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

export const verifyQuery = Joi.object({
  token: Joi.string().required(),
  user: Joi.string().required(),
});
