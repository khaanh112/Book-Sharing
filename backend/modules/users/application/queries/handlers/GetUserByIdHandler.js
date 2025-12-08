import User from '../../../domain/User.model.js';

class GetUserByIdHandler {
  async handle(query) {
    query.validate();
    const user = await User.findById(query.userId).select('-passwordHash');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

export default GetUserByIdHandler;
