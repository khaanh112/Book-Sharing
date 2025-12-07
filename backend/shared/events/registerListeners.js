// shared/events/registerListeners.js
/**
 * Register all event listeners
 * Import this file in index.js to initialize event-driven architecture
 */

import './listeners/NotificationListener.js';
import './listeners/EmailListener.js';
import './listeners/CacheInvalidationListener.js';
import readModelSync from './listeners/ReadModelSyncListener.js';

console.log('\n🎧 Event-Driven Architecture initialized!');
console.log('   - NotificationListener registered');
console.log('   - EmailListener registered');
console.log('   - CacheInvalidationListener registered');
console.log('   - ReadModelSyncListener registered (TRUE CQRS)\n');

export default function registerAllListeners() {
  // Listeners are registered via imports above
  return {
    listeners: [
      'NotificationListener',
      'EmailListener',
      'CacheInvalidationListener',
      'ReadModelSyncListener'
    ]
  };
}

/**
 * Perform initial sync from MongoDB to Redis Read Model
 * Call this after database connection is established
 */
export async function performInitialReadModelSync() {
  try {
    console.log('\n🔄 Starting initial Read Model sync...');
    await readModelSync.performInitialSync();
    console.log('✅ Initial Read Model sync completed\n');
  } catch (error) {
    console.error('❌ Initial Read Model sync failed:', error);
    console.log('⚠️ Application will continue, read model will sync on-demand\n');
  }
}
