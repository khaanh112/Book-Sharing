// modules/users/index.js
import UserService from './domain/UserService.js';
import UserRepository from './infrastructure/UserRepository.js';
import userRoutes from './interface/UserRoutes.js';

// Initialize repository and service
const userRepository = new UserRepository();
const userService = new UserService(userRepository);

// Event types this module publishes
const UserEvents = {
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  USER_UPDATED: 'user.updated'
};

export {
  userService,
  userRepository,
  userRoutes,
  UserEvents
};

export default {
  service: userService,
  repository: userRepository,
  routes: userRoutes,
  events: UserEvents
};
