const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, '0xE000006'],
        validation: {
            validator: value => /^([آ-ی]{3,}\s{0,1}){1,3}$/.test(value),
            message: '0xE000007'
        }
    },
    lastName: {
        type: String,
        required: [true, '0xE000008'],
        validation: {
            validator: value => /^([آ-ی]{3,}\s{0,1}){1,3}$/.test(value),
            message: '0xE000009'
        }
    },
    email: {
        type: String,
        validation: {
            validator: value => /^(([^<>()\[\].,;:\s@"]+(\.[^<>()\[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/.test(value)
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        required: [true, '0xE00000A'],
        validate: {
            validator: value => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,100}$/.test(value),
            message: '0xE00000B'
        },
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: Date,
    rote: {
        type: String,
        enum: {
            values: ['admin', 'user', 'manager'],
            message: '0xE00000C'
        },
        default: 'user'
    },
    verifyEmailToken: {
        type: String,
        select: false
    },
    verifyEmailExpires: Date,
    phone: {
        type: String,
        required: [true, '0xE00000D'],
        validate: {
            validator: value => /^00989[0-9]{9}$/.test(value),
            message: '0xE00000E'
        }
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    verifyPhoneToken: {
        type: String,
        select: false
    },
    verifyPhoneExpires: Date,
    VerifyEmailExpires: Date
});

userSchema.methods.createResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(64).toString('hex');
    this.passwordResetToken =
        crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
    this.VerifyEmailExpires = Date.now() + 600000;
    return resetToken;
};

userSchema.methods.createVerifyEmailToken = function () {
    const verifyEmailToken = crypto.randomBytes(64).toString('hex');
    this.verifyEmailToken =
        crypto
            .createHash('sha256')
            .update(verifyToken)
            .digest('hex');
    this.verifyEmailExpires = Date.now() + 600000;
    return verifyEmailToken;
};

userSchema.methods.createVerifyPhoneToken = function () {
    const verifyPhoneToken = crypto.randomBytes(64).toString('hex');
    this.verifyPhoneToken =
        crypto
            .createHash('sha256')
            .update(verifyToken)
            .digest('hex');
    this.verifyPhoneExpires = Date.now() + 600000;
    return verifyPhoneToken;
};

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isPasswordChanged = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        if (this.passwordChangedAt.getTime() / 1000 > JWTTimeStamp) {
            return true;
        }
    }
    return false;
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.pre('save', function (next) {
    if (this.isModified('password') && !this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
        this.passwordResetToken = undefined;
        this.passwordResetExpires = undefined;
    }
    next();
});

userSchema.pre('save', function (next) {
    if (this.isModified('isEmailVerified') && !this.isNew) {
        this.verifyEmailToken = undefined;
        this.VerifyEmailExpires = undefined;
    }
    next();
});

userSchema.pre('save', function (next) {
    if (this.isModified('isPhoneVerified') && !this.isNew) {
        this.verifyEmailToken = undefined;
        this.VerifyEmailExpires = undefined;
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;