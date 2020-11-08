const authRouter = require('express').Router();
const authController = require('../controllers/authController');

authRouter.route('/register').post(authController.registerUser);
authRouter.route('/login').post(authController.loginUser);
authRouter.route('/forgotpassword').post(authController.forgotPassword);
authRouter.route('/resetpassword/:token').put(authController.resetPassword);

//Dahboard
authRouter.route('/me').get(authController.protect, authController.getMe);
authRouter.route('/updateme').patch(authController.protect, authController.updateMe);
authRouter
  .route('/updatemypassword')
  .patch(authController.protect, authController.updateMyPassword);

module.exports = authRouter;
