/**
 * Debounce function - delay execution until after wait time has elapsed
 * since the last call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function - ensures function is called at most once per wait period
 * @param {Function} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, wait = 300) => {
  let inThrottle;
  let lastTime;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      lastTime = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
};

/**
 * Rate limit checker - prevents function execution if rate limit is active
 * @param {Function} func - Function to wrap
 * @param {Function} onRateLimited - Callback when rate limited
 * @returns {Function} Rate-limited function
 */
export const withRateLimitCheck = (func, onRateLimited) => {
  return async function executedFunction(...args) {
    // Check if currently rate limited
    const rateLimitEvent = new CustomEvent('checkRateLimit');
    window.dispatchEvent(rateLimitEvent);
    
    // Simple check - you can enhance this with state management
    try {
      return await func(...args);
    } catch (error) {
      if (error.response?.status === 429) {
        if (onRateLimited) {
          onRateLimited(error);
        }
      }
      throw error;
    }
  };
};

/**
 * Request queue manager - queues requests when rate limited
 */
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.delay = 1000; // Default delay between requests
  }

  add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      if (!this.processing) {
        this.process();
      }
    });
  }

  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      if (error.response?.status === 429) {
        // Re-queue the request
        this.queue.unshift({ requestFn, resolve, reject });
        
        // Get retry delay from error
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter ? Number(retryAfter) * 1000 : this.delay * 2;
        
        await new Promise(r => setTimeout(r, delay));
      } else {
        reject(error);
      }
    }

    // Wait before processing next request
    await new Promise(r => setTimeout(r, this.delay));
    this.process();
  }

  clear() {
    this.queue = [];
    this.processing = false;
  }
}

export const requestQueue = new RequestQueue();

/**
 * Batch requests helper
 * @param {Array} requests - Array of request functions
 * @param {number} batchSize - Number of concurrent requests
 * @param {number} delayBetweenBatches - Delay between batches in ms
 */
export const batchRequests = async (requests, batchSize = 5, delayBetweenBatches = 1000) => {
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(requestFn => requestFn())
    );
    results.push(...batchResults);
    
    // Delay between batches to avoid rate limit
    if (i + batchSize < requests.length) {
      await new Promise(r => setTimeout(r, delayBetweenBatches));
    }
  }
  
  return results;
};
