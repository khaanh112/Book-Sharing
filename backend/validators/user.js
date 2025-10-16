import Joi from 'joi';

export const changePasswordBody = Joi.object({
  oldPassword: Joi.string().min(6).max(128).required(),
  newPassword: Joi.string().min(6).max(128).disallow(Joi.ref('oldPassword')).required(),
});

export const updateBody = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
}).min(1);
