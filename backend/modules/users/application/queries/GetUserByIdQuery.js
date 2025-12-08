import BaseQuery from './BaseQuery.js';

class GetUserByIdQuery extends BaseQuery {
  constructor(data) {
    super();
    this.userId = typeof data === 'string' ? data : data.userId;
  }

  validate() {
    if (!this.userId) {
      throw new Error('GetUserByIdQuery validation failed: User ID is required');
    }
  }
}

export default GetUserByIdQuery;
