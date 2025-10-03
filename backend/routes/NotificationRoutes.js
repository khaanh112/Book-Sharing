import { Router } from 'express';
import validateToken from '../middlewares/validateTokenHandler.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getUnreadCount
} from '../Controllers/NotificationController.js';

const router = Router();

// Tất cả routes đều cần authentication
router.use(validateToken);

// GET /api/notifications - Lấy tất cả notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Lấy số lượng unread
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/:id/read - Đánh dấu 1 notification đã đọc
router.put('/:id/read', markAsRead);

// PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.put('/read-all', markAllAsRead);

// DELETE /api/notifications/read - Xóa tất cả đã đọc (PHẢI ĐẶT TRƯỚC /:id)
router.delete('/read', deleteReadNotifications);

// DELETE /api/notifications/:id - Xóa 1 notification
router.delete('/:id', deleteNotification);

export default router;
