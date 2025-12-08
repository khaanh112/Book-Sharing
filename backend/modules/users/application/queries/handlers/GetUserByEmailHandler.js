import User from '../../../domain/User.model.js';

class GetUserByEmailHandler {
  async handle(query) {
    query.validate();
    const user = await User.findOne({ email: query.email });
    return user;
  }
}

export default GetUserByEmailHandler;
