// shared/events/EventBus.js
import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Support many listeners
  }

  /**
   * Emit event with logging
   */
  emit(event, data) {
    console.log(`📢 Event emitted: ${event}`, JSON.stringify(data, null, 2));
    return super.emit(event, data);
  }

  /**
   * Register event listener with error handling
   */
  on(event, handler) {
    console.log(`👂 Listener registered: ${event}`);
    super.on(event, async (data) => {
      try {
        await handler(data);
      } catch (error) {
        console.error(`❌ Listener failed for ${event}:`, error.message);
        // Don't throw - keep other listeners running
      }
    });
  }

  /**
   * Get all registered event names
   */
  getRegisteredEvents() {
    return this.eventNames();
  }

  /**
   * Get listener count for an event
   */
  getListenerCount(event) {
    return this.listenerCount(event);
  }
}

// Export singleton instance
const eventBus = new EventBus();
export default eventBus;
