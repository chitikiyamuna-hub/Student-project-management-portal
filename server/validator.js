const Joi = require('joi');

const taskCreateSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Title must be a text string',
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().allow('').max(1000).messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed').messages({
    'any.only': 'Status must be either Pending, In Progress, or Completed'
  })
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(100).messages({
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot exceed 100 characters'
  }),
  description: Joi.string().allow('').max(1000).messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed').messages({
    'any.only': 'Status must be either Pending, In Progress, or Completed'
  })
}).min(1); // At least one field must be updated

module.exports = {
  validateCreate: (data) => taskCreateSchema.validate(data, { abortEarly: false }),
  validateUpdate: (data) => taskUpdateSchema.validate(data, { abortEarly: false })
};
