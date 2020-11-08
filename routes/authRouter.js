const authRouter = require('express').Router();
const authController = require('../controllers/authController');

authRouter.route('/register').post(authController.registerUser);

module.exports = authRouter;
