const userRouter = require('express').Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

userRouter.use(authController.restrictTo('admin'));
//- get users and create user
userRouter.route('/').get(usersController.getAllUsers).post(usersController.createUser);

//- get single user and update user
userRouter
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = userRouter;
