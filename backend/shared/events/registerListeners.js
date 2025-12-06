// shared/events/registerListeners.js
/**
 * Register all event listeners
 * Import this file in index.js to initialize event-driven architecture
 */

import './listeners/NotificationListener.js';
import './listeners/EmailListener.js';
import './listeners/CacheInvalidationListener.js';

console.log('\n🎧 Event-Driven Architecture initialized!');
console.log('   - NotificationListener registered');
console.log('   - EmailListener registered');
console.log('   - CacheInvalidationListener registered\n');

export default function registerAllListeners() {
  // Listeners are registered via imports above
  return {
    listeners: [
      'NotificationListener',
      'EmailListener',
      'CacheInvalidationListener'
    ]
  };
}
