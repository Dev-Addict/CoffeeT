const crypto = require('crypto');
const {promisify} = require('util');
const jsonWebToken = require('jsonwebtoken');

const User = require('../models/User');
const catchRequest = require('../utils/catchRequest');
const AppError = require('../utils/AppError');

exports.protect = catchRequest(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        throw new AppError('0xE00000F', 401);
    }
    const decodedToken = await promisify(jsonWebToken.verify)(token, process.env.JSON_WEB_TOKEN_SECRET);
    const user = await User.findById(decodedToken.id);
    if (!user) {
        throw new AppError(
            '0xE000010',
            401
        );
    }
    if (user.isPasswordChanged(decodedToken.iat)) {
        throw new AppError(
            '0xE000011',
            401
        );
    }
    req.user = user;
    next();
});

exports.restrictTo = (...rotes) => {
    return catchRequest(
        async (req, res, next) => {
            if (rotes.includes(req.user.rote)) {
                return next();
            }
            if (rotes.includes('selfUser')) {
                if (req.params.id === req.user._id.toString()) {
                    return next();
                }
            }
            if (rotes.includes('filterUser')) {
                req.query.fields += '-phone';
                return next();
            }
            throw new AppError('0xE000012', 403);
        }
    );
};

const signToken = ({_id}) => {
    return jsonWebToken.sign(
        {
            id: _id
        },
        process.env.JSON_WEB_TOKEN_SECRET,
        {
            expiresIn: process.env.JSON_WEB_TOKEN_TIME
        }
    );
};

const sendToken = (user, statusCode, res) => {
    const token = signToken(user);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signOut = (req, res) => {
    res.clearCookie('jwt');
    res.status(200).json({status: 'success'})
};

exports.signIn = catchRequest(async (req, res) => {
    const {phone, password} = req.body;
    if (
        !phone ||
        !password ||
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,100}$/.test(password) ||
        !/^00989[0-9]{9}$/.test(phone)) {
        throw new AppError('0xE000014', 400);
    }
    const user = await User.findOne({phone}).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        throw new AppError('0xE000015', 401);
    }

    sendToken(user, 200, res);
});

exports.isSignedIn = catchRequest(
    async (req, res) => {
        res.status(200).json({
            status: 'success',
            data: {
                user: req.user
            }
        });
    }
);