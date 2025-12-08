import BaseQuery from './BaseQuery.js';

class GetUserByEmailQuery extends BaseQuery {
  constructor(data) {
    super();
    this.email = typeof data === 'string' ? data : data.email;
  }

  validate() {
    if (!this.email) {
      throw new Error('GetUserByEmailQuery validation failed: Email is required');
    }
  }
}

export default GetUserByEmailQuery;
