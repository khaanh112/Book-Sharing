/**
 * CQRS Bootstrap - Registers all command and query handlers
 * This file should be imported and called during application startup
 */

import commandBus from './CommandBus.js';
import queryBus from './QueryBus.js';

// Command Handlers - Now from modules
import CreateBookHandler from '../modules/books/application/commands/handlers/CreateBookHandler.js';
import UpdateBookHandler from '../modules/books/application/commands/handlers/UpdateBookHandler.js';
import DeleteBookHandler from '../modules/books/application/commands/handlers/DeleteBookHandler.js';

// Query Handlers - Now from modules
import GetBookByIdHandler from '../modules/books/application/queries/handlers/GetBookByIdHandler.js';
import GetAllBooksHandler from '../modules/books/application/queries/handlers/GetAllBooksHandler.js';
import SearchBooksHandler from '../modules/books/application/queries/handlers/SearchBooksHandler.js';
import GetMyBooksHandler from '../modules/books/application/queries/handlers/GetMyBooksHandler.js';

// User Query Handlers
import GetUserByIdHandler from '../modules/users/application/queries/handlers/GetUserByIdHandler.js';
import GetUserByEmailHandler from '../modules/users/application/queries/handlers/GetUserByEmailHandler.js';

/**
 * Initialize CQRS system by registering all handlers
 */
function initializeCQRS() {
  console.log('\n🚀 Initializing CQRS Pattern...\n');

  // Register Command Handlers
  console.log('📝 Registering Command Handlers:');
  commandBus.register('CreateBookCommand', new CreateBookHandler());
  commandBus.register('UpdateBookCommand', new UpdateBookHandler());
  commandBus.register('DeleteBookCommand', new DeleteBookHandler());

  // Register Query Handlers
  console.log('\n🔍 Registering Query Handlers:');
  queryBus.register('GetBookByIdQuery', new GetBookByIdHandler());
  queryBus.register('GetAllBooksQuery', new GetAllBooksHandler());
  queryBus.register('SearchBooksQuery', new SearchBooksHandler());
  queryBus.register('GetMyBooksQuery', new GetMyBooksHandler());
  
  // User Query Handlers
  queryBus.register('GetUserByIdQuery', new GetUserByIdHandler());
  queryBus.register('GetUserByEmailQuery', new GetUserByEmailHandler());

  console.log('\n✅ CQRS system initialized successfully!');
  console.log(`   - ${commandBus.getRegisteredCommands().length} command handlers registered`);
  console.log(`   - ${queryBus.getRegisteredQueries().length} query handlers registered\n`);
}

export default initializeCQRS;
export { commandBus, queryBus };