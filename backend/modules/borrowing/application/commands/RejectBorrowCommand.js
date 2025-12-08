// modules/borrowing/application/commands/RejectBorrowCommand.js
class RejectBorrowCommand {
  constructor(data) {
    Object.assign(this, data);
  }

  validate() {
    // Add validation logic
    return true;
  }
}

export default RejectBorrowCommand;
