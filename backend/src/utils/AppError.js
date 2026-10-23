/**
 * AppError - Custom Operational Error class
 * Extends built-in Error with HTTP status code and operational flag
 */
class AppError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Indicates expected operational error vs programmer bug
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
