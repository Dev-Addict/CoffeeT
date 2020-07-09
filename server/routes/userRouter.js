const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/auth/checktoken').post(authController.protect, authController.isSignedIn);
router.route('/auth/signout').get(authController.signOut);
router.route('/auth/signin').post(authController.signIn);

router.route('/')
    .get(authController.protect, authController.restrictTo('admin'), userController.getUsers)
    .post(authController.protect, authController.restrictTo('admin'), userController.createUser);
router.route('/:id')
    .get(authController.protect, authController.restrictTo('admin', 'selfUser', 'filterUser'), userController.getUser)
    .patch(authController.protect, authController.restrictTo('admin', 'selfUser'), userController.updateUser)
    .delete(authController.protect, authController.restrictTo('admin'), userController.deleteUser);

module.exports = router;