const AppError = require('../utils/AppError');

const handleCastErrorDB = () => {
    return new AppError('0xE000000', 400);
};

const handleDuplicateFieldsDB = () => {
    return new AppError('0xE000001', 400);
};

const handleValidationErrorDB = err => {
    return new AppError('0xE000002', 400);
};

const handleWebTokenError =
    () => new AppError('0xE000003', 401);

const handleJsonWebTokenExpiredError =
    () => new AppError('0xE000004', 401);

const sendErrorDevelopment = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err
    });
};

const sendErrorProduction = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        res.status(500).json({
            status: 'err',
            message: '0xE000005'
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDevelopment(err, res);
    } else {
        let error = {...err};
        if (error.name === 'CastError') {
            error = handleCastErrorDB(error);
        }
        if (error.code === 11000) {
            error = handleDuplicateFieldsDB(error);
        }
        if (error.name === 'ValidationError') {
            error = handleValidationErrorDB(error);
        }
        if (error.name === 'JsonWebTokenError') {
            error = handleWebTokenError();
        }
        if (error.name === 'UnauthorizedError') {
            error = handleJsonWebTokenExpiredError();
        }
        sendErrorProduction(error, res);
    }
};