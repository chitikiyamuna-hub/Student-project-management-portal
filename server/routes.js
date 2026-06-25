const express = require('express');
const router = express.Router();
const db = require('./db');
const Joi = require('joi');

// Helper to catch async route errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation schemas for authentication
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Name must be at least 3 characters long'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'A valid email address is required',
    'string.empty': 'Email is required'
  }),
  rollNo: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'Student ID / Roll Number is required'
  }),
  branch: Joi.string().required().messages({
    'string.empty': 'Branch / Department is required'
  }),
  college: Joi.string().allow('').max(255),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please specify a valid email address',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

// Task validations
const { validateCreate, validateUpdate } = require('./validator');

// ==========================================
// 🔓 OPEN AUTH ENDPOINTS
// ==========================================

// POST /api/auth/register - Create account
router.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        error: 'Registration validation failed',
        details
      });
    }

    try {
      const user = await db.createUser(value);
      res.status(201).json({
        success: true,
        message: 'Account created successfully. Please sign in.',
        data: user
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message || 'Registration failed'
      });
    }
  })
);

// POST /api/auth/login - Sign In
router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        error: 'Login validation failed',
        details
      });
    }

    const user = await db.verifyUser(value.email, value.password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password combination.'
      });
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: user
    });
  })
);

// ==========================================
// 🔒 AUTHENTICATED GATEWAY MIDDLEWARE
// ==========================================
const requireAuth = (req, res, next) => {
  const studentEmail = req.headers['x-student-email'];
  if (!studentEmail) {
    return res.status(401).json({
      success: false,
      error: 'Access denied: Authentication session headers are missing.'
    });
  }
  req.studentEmail = studentEmail;
  next();
};

// Apply auth middleware to all project task routes
router.use(requireAuth);

// GET /api/stats - Statistics Overview
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await db.getStats(req.studentEmail);
    res.json({
      success: true,
      activeDatabase: db.getActiveAdapter(),
      data: stats
    });
  })
);

// GET /api/tasks - Retrieve scoped tasks
router.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const { search, status, sort } = req.query;
    const tasks = await db.getAll({ search, status, sort }, req.studentEmail);
    res.json({
      success: true,
      activeDatabase: db.getActiveAdapter(),
      data: tasks
    });
  })
);

// GET /api/tasks/:id - Retrieve single scoped task
router.get(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    const task = await db.getById(req.params.id, req.studentEmail);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or access denied.'
      });
    }
    res.json({
      success: true,
      data: task
    });
  })
);

// POST /api/tasks - Create task under student owner
router.post(
  '/tasks',
  asyncHandler(async (req, res) => {
    const { error, value } = validateCreate(req.body);
    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details
      });
    }

    const newTask = await db.create(value, req.studentEmail);
    res.status(201).json({
      success: true,
      message: 'Project registered successfully',
      data: newTask
    });
  })
);

// PUT /api/tasks/:id - Update scoped task
router.put(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    const { error, value } = validateUpdate(req.body);
    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details
      });
    }

    try {
      const updatedTask = await db.update(req.params.id, value, req.studentEmail);
      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          error: 'Task not found or failed to modify.'
        });
      }
      res.json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
      });
    } catch (err) {
      res.status(403).json({
        success: false,
        error: err.message
      });
    }
  })
);

// DELETE /api/tasks/:id - Delete scoped task
router.delete(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    try {
      const success = await db.delete(req.params.id, req.studentEmail);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Task not found or failed to delete.'
        });
      }
      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (err) {
      res.status(403).json({
        success: false,
        error: err.message
      });
    }
  })
);

module.exports = router;
