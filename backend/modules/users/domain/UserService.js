// modules/users/domain/UserService.js
import eventBus from '../../../shared/events/EventBus.js';
import EventTypes from '../../../shared/events/EventTypes.js';

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Register new user
   */
  async registerUser(userData) {
    const user = await this.userRepository.create(userData);
    
    // Emit event for async email verification
    eventBus.emit(EventTypes.USER_REGISTERED, {
      userId: user._id,
      email: user.email,
      verificationToken: userData.verificationToken
    });
    
    return user;
  }

  /**
   * Verify user email
   */
  async verifyUser(userId) {
    const user = await this.userRepository.updateVerification(userId, true);
    
    // Emit event
    eventBus.emit(EventTypes.USER_VERIFIED, {
      userId: user._id
    });
    
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const user = await this.userRepository.update(userId, updateData);
    
    // Emit event
    eventBus.emit(EventTypes.USER_UPDATED, {
      userId: user._id
    });
    
    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Validate user credentials
   */
  validateUserData(userData) {
    const errors = [];

    if (!userData.name || userData.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }

    if (!userData.passwordHash) {
      errors.push('Password is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default UserService;
