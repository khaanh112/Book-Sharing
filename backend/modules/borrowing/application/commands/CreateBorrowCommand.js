// modules/borrowing/application/commands/CreateBorrowCommand.js
class CreateBorrowCommand {
  constructor(data) {
    Object.assign(this, data);
  }

  validate() {
    // Add validation logic
    return true;
  }
}

export default CreateBorrowCommand;
