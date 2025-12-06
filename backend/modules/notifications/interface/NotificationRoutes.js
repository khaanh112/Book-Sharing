import { Router } from 'express';
import validateToken from '../../../shared/middlewares/validateTokenHandler.js';
import validateRequest from '../../../shared/middlewares/validateRequest.js';
import { idParam, listQuery } from '../../../shared/validators/notification.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getUnreadCount
} from './NotificationController.js';

const router = Router();

// Tất cả routes đều cần authentication
router.use(validateToken);

// GET /api/notifications/unread-count - Lấy số lượng unread (must be before '/' to avoid route conflict)
router.get('/unread-count', getUnreadCount);

// GET /api/notifications - Lấy tất cả notifications
router.get('/', validateRequest({ query: listQuery }), getNotifications);

// PUT /api/notifications/:id/read - Đánh dấu 1 notification đã đọc
router.put('/:id/read', validateRequest({ params: idParam }), markAsRead);

// PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.put('/read-all', markAllAsRead);

// DELETE /api/notifications/read - Xóa tất cả đã đọc (PHẢI ĐẶT TRƯỚC /:id)
router.delete('/read', deleteReadNotifications);

// DELETE /api/notifications/:id - Xóa 1 notification
router.delete('/:id', validateRequest({ params: idParam }), deleteNotification);

export default router;
