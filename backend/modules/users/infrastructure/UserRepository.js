// modules/users/infrastructure/UserRepository.js
import User from '../domain/User.model.js';

class UserRepository {
  /**
   * Create a new user
   */
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  /**
   * Find user by ID
   */
  async findById(userId) {
    return await User.findById(userId).select('-passwordHash').lean();
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await User.findOne({ email }).lean();
  }

  /**
   * Find user by email (with password for authentication)
   */
  async findByEmailWithPassword(email) {
    return await User.findOne({ email });
  }

  /**
   * Update user
   */
  async update(userId, updateData) {
    return await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');
  }

  /**
   * Update verification status
   */
  async updateVerification(userId, isVerified) {
    return await User.findByIdAndUpdate(
      userId,
      { isVerified },
      { new: true }
    ).select('-passwordHash');
  }

  /**
   * Delete user
   */
  async delete(userId) {
    return await User.findByIdAndDelete(userId);
  }

  /**
   * Find all users with filters
   */
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const users = await User.find(filters)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filters);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export default UserRepository;
