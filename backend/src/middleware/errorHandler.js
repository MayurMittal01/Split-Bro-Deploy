const AppError = require('../utils/AppError');

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
    next(new AppError(`Endpoint not found on this server: ${req.method} ${req.originalUrl}`, 404));
};

// Centralized Express Error Handling Middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;
    error.status = err.status || 'error';

    // 1. Mongoose Bad ObjectId (CastError)
    if (err.name === 'CastError') {
        const message = `Resource not found with invalid ID format: ${err.value}`;
        error = new AppError(message, 400);
    }

    // 2. Mongoose Duplicate Key Error (Code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const value = err.keyValue ? err.keyValue[field] : '';
        const message = `Duplicate value '${value}' entered for ${field}. Please use another value.`;
        error = new AppError(message, 409);
    }

    // 3. Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        const message = `Validation error: ${errors.join('. ')}`;
        error = new AppError(message, 400, errors);
    }

    // 4. JWT Verification Error
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid authentication token.', 401);
    }

    // 5. JWT Expired Error
    if (err.name === 'TokenExpiredError') {
        error = new AppError('Authentication token has expired. Please log in again.', 401);
    }

    // 6. Multer File Upload Errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = new AppError('Uploaded file exceeds the maximum allowed size (5 MB)', 400);
        } else {
            error = new AppError(`File upload error: ${err.message}`, 400);
        }
    }

    // Log unexpected non-operational errors
    if (!error.isOperational) {
        console.error('[UNEXPECTED SERVER ERROR]', err);
    }

    const responsePayload = {
        status: error.status,
        message: error.message || 'An unexpected server error occurred'
    };

    if (error.errors) {
        responsePayload.errors = error.errors;
    }

    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development' && !error.isOperational) {
        responsePayload.stack = err.stack;
    }

    res.status(error.statusCode).json(responsePayload);
};

module.exports = {
    notFoundHandler,
    errorHandler
};
