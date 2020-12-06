const userRouter = require('express').Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
userRouter.use(authController.protect);

userRouter.use(authController.restrictTo('admin'));
//- get users and create user
userRouter.route('/').get(userController.getAllUsers).post(userController.createUser);

//- get single user and update user
userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
