// modules/borrowing/application/commands/CancelBorrowCommand.js
class CancelBorrowCommand {
  constructor(data) {
    Object.assign(this, data);
  }

  validate() {
    // Add validation logic
    return true;
  }
}

export default CancelBorrowCommand;
