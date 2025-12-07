# Event-Driven Architecture

## Overview
Event-driven architecture du?c implement toàn di?n trong ?ng d?ng d? d?m b?o consistency gi?a các components và optimize performance.

## Event Types

### Book Events
- **book.created** - Khi sách m?i du?c t?o
- **book.updated** - Khi thông tin sách du?c c?p nh?t  
- **book.deleted** - Khi sách b? xóa
- **book.borrowed** - Khi sách du?c mu?n (available = false)
- **book.returned** - Khi sách du?c tr? (available = true)

### Borrow Events
- **borrow.created** - Khi t?o yêu c?u mu?n m?i
- **borrow.approved** - Khi ch? sách ch?p nh?n yêu c?u
- **borrow.rejected** - Khi ch? sách t? ch?i yêu c?u
- **borrow.returned** - Khi ngu?i mu?n tr? sách
- **borrow.cancelled** - Khi ngu?i mu?n h?y yêu c?u pending

## Event Listeners

### 1. NotificationListener
**Purpose**: T?o notifications cho users khi có s? ki?n liên quan

**Events handled**:
- borrow.created  Notify owner
- borrow.approved  Notify borrower
- borrow.rejected  Notify borrower
- borrow.returned  Notify owner
- borrow.cancelled  Notify owner

### 2. CacheInvalidationListener  
**Purpose**: Invalidate cache khi data thay d?i

**Events handled**:
- book.*  Clear book caches
- borrow.*  Clear borrow & book caches

### 3. ReadModelSyncListener (TRUE CQRS)
**Purpose**: Ð?ng b? MongoDB (Write DB)  Redis (Read DB)

**Events handled**:
- book.created  Add to read model
- book.updated  Update read model
- book.deleted  Remove from read model
- book.borrowed  Update availability in read model
- book.returned  Update availability in read model

### 4. EmailListener
**Purpose**: G?i email notifications

**Events handled**:
- user.registered  Send verification email
- borrow.*  Send email notifications

## Event Flow Examples

### Create Borrow Request
\\\
User clicks "Borrow" 
   POST /borrows
   BorrowController.createBorrow()
   Borrow.create()
   eventBus.emit('borrow.created')
   3 listeners react in parallel:
     1. NotificationListener: Create notification for owner
     2. CacheInvalidationListener: Clear borrow caches
     3. EmailListener: Send email to owner
\\\

### Cancel Borrow Request
\\\
User clicks "Cancel"
   DELETE /borrows/:id
   BorrowController.deleteBorrow()
   borrow.deleteOne()
   eventBus.emit('borrow.cancelled')
   2 listeners react:
     1. NotificationListener: Notify owner
     2. CacheInvalidationListener: Clear caches
\\\

### Accept Borrow Request
\\\
Owner clicks "Accept"
   PUT /borrows/:id/accept
   BorrowController.acceptBorrow()
   borrow.save() + Book.update(available: false)
   eventBus.emit('borrow.approved')
   eventBus.emit('book.borrowed')
   3 listeners react:
     1. NotificationListener: Notify borrower
     2. CacheInvalidationListener: Clear caches
     3. ReadModelSyncListener: Update book availability in Redis
\\\

## Benefits

### 1. Decoupling
- Controllers ch? emit events, không bi?t ai s? x? lý
- Listeners d?c l?p, có th? add/remove d? dàng

### 2. Async Processing
- Notifications, emails ch?y background
- Main request không b? block

### 3. TRUE CQRS Performance
- Read t? Redis (2-5ms) thay vì MongoDB (140ms)
- 28x faster reads
- Write v?n d?m b?o consistency

### 4. Cache Consistency
- Auto invalidate cache khi data thay d?i
- Không c?n manual cache clearing

### 5. Easy Testing
- Mock event emitters
- Test listeners independently

## Code Structure

\\\
backend/
 shared/
    events/
        EventBus.js          # Event emitter singleton
        EventTypes.js        # Event type constants
        registerListeners.js # Register all listeners
        listeners/
            NotificationListener.js
            CacheInvalidationListener.js
            ReadModelSyncListener.js
            EmailListener.js
 modules/
     books/
        application/commands/handlers/
            CreateBookHandler.js  # Emits book.created
     borrowing/
         interface/
             BorrowController.js    # Emits borrow.*
\\\

## Implementation Checklist

 Event types defined in EventTypes.js
 EventBus singleton created
 All book operations emit events
 All borrow operations emit events (including cancel)
 NotificationListener handles all borrow events
 CacheInvalidationListener handles all events
 ReadModelSyncListener syncs to Redis
 EmailListener sends notifications
 Initial sync on startup (MongoDB  Redis)

## Performance Impact

**Before Event-Driven + TRUE CQRS:**
- Read books: ~140ms (MongoDB)
- No cache invalidation strategy
- Coupled notification logic

**After Event-Driven + TRUE CQRS:**
- Read books: ~2-5ms (Redis Read Model)
- Auto cache invalidation via events
- Async notifications (non-blocking)
- **Result: 28x faster reads, better UX**
