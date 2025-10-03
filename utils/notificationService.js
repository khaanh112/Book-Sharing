import Notification from '../models/Notificaion.js';
import { sendNotificationEmail } from './sendNotificationEmail.js';

/**
 * Tạo notification và gửi email (chỉ gửi email cho due date notifications)
 */
const createNotification = async ({ userId, type, title, message, relatedId, bookTitle, senderName, sendEmail = false }) => {
  try {
    // Tạo notification trong DB
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
      bookTitle,
      senderName,
      read: false
    });

    // Chỉ gửi email cho due date notifications
    if (sendEmail) {
      sendNotificationEmail(userId, { type, title, message, bookTitle, senderName })
        .catch(err => console.error('Error sending notification email:', err));
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Notification khi có borrow request mới
 */
export const notifyNewBorrowRequest = async (ownerId, borrowerName, bookTitle, borrowId) => {
  return createNotification({
    userId: ownerId,
    type: 'borrow_request_new',
    title: 'New Borrow Request',
    message: `${borrowerName} wants to borrow your book "${bookTitle}"`,
    relatedId: borrowId,
    bookTitle,
    senderName: borrowerName
  });
};

/**
 * Notification khi borrow request được chấp nhận
 */
export const notifyBorrowAccepted = async (borrowerId, ownerName, bookTitle, borrowId) => {
  return createNotification({
    userId: borrowerId,
    type: 'borrow_request_accepted',
    title: 'Borrow Request Accepted',
    message: `${ownerName} accepted your request to borrow "${bookTitle}"`,
    relatedId: borrowId,
    bookTitle,
    senderName: ownerName
  });
};

/**
 * Notification khi borrow request bị từ chối
 */
export const notifyBorrowRejected = async (borrowerId, ownerName, bookTitle, borrowId) => {
  return createNotification({
    userId: borrowerId,
    type: 'borrow_request_rejected',
    title: 'Borrow Request Rejected',
    message: `${ownerName} rejected your request to borrow "${bookTitle}"`,
    relatedId: borrowId,
    bookTitle,
    senderName: ownerName
  });
};

/**
 * Notification khi sắp đến hạn trả sách (3 ngày trước) - GỬI EMAIL
 */
export const notifyDueSoon = async (borrowerId, bookTitle, dueDate, borrowId) => {
  const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  return createNotification({
    userId: borrowerId,
    type: 'borrow_due_soon',
    title: 'Book Due Soon',
    message: `Your borrowed book "${bookTitle}" is due in ${daysLeft} day(s)`,
    relatedId: borrowId,
    bookTitle,
    sendEmail: true // Gửi email cho due soon
  });
};

/**
 * Notification khi quá hạn trả sách - GỬI EMAIL
 */
export const notifyOverdue = async (borrowerId, bookTitle, borrowId) => {
  return createNotification({
    userId: borrowerId,
    type: 'borrow_overdue',
    title: 'Book Overdue',
    message: `Your borrowed book "${bookTitle}" is overdue. Please return it as soon as possible.`,
    relatedId: borrowId,
    bookTitle,
    sendEmail: true // Gửi email cho overdue
  });
};

/**
 * Notification khi sách đã được trả
 */
export const notifyBookReturned = async (ownerId, borrowerName, bookTitle, borrowId) => {
  return createNotification({
    userId: ownerId,
    type: 'book_returned',
    title: 'Book Returned',
    message: `${borrowerName} has returned your book "${bookTitle}"`,
    relatedId: borrowId,
    bookTitle,
    senderName: borrowerName
  });
};
