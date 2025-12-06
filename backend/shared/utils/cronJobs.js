import cron from 'node-cron';
import Borrow from '../../modules/borrowing/domain/Borrow.model.js';
import { notifyDueSoon, notifyOverdue } from './notificationService.js';

/**
 * Cron job chạy hàng ngày lúc 9:00 sáng
 * Kiểm tra và gửi thông báo cho:
 * - Sách sắp đến hạn (3 ngày trước)
 * - Sách quá hạn
 */
export const scheduleDueDateNotifications = () => {
  // Chạy mỗi ngày lúc 9:00 sáng
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running due date notification check...');
    
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);


      const borrows = await Borrow.find({ 
        status: 'accepted',
        dueDate: { $exists: true }
      }).populate('bookId borrowerId');

      for (const borrow of borrows) {
        const dueDate = new Date(borrow.dueDate);
        
        // Kiểm tra quá hạn
        if (dueDate < now) {
          console.log(`📕 Book overdue: ${borrow.bookId?.title}`);
          await notifyOverdue(
            borrow.borrowerId._id,
            borrow.bookId?.title,
            borrow._id
          );
        }
        // Kiểm tra sắp đến hạn (3 ngày)
        else if (dueDate <= threeDaysFromNow) {
          const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
          console.log(`📙 Book due soon: ${borrow.bookId?.title} (${daysLeft} days)`);
          await notifyDueSoon(
            borrow.borrowerId._id,
            borrow.bookId?.title,
            dueDate,
            borrow._id
          );
        }
      }

      console.log('✅ Due date notification check completed');
    } catch (error) {
      console.error('❌ Error in due date notification cron:', error);
    }
  });

  console.log('✅ Due date notification cron job scheduled (daily at 9:00 AM)');
};

/**
 * Function để test notification ngay lập tức (không cần đợi cron)
 */
export const checkDueDateNotificationsNow = async () => {
  console.log('🔔 Manually checking due date notifications...');
  
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const borrows = await Borrow.find({ 
      status: 'accepted',
      dueDate: { $exists: true }
    }).populate('bookId borrowerId');

    let overdueCount = 0;
    let dueSoonCount = 0;

    for (const borrow of borrows) {
      const dueDate = new Date(borrow.dueDate);
      
      if (dueDate < now) {
        overdueCount++;
        await notifyOverdue(
          borrow.borrowerId._id,
          borrow.bookId?.title,
          borrow._id
        );
      }
      else if (dueDate <= threeDaysFromNow) {
        dueSoonCount++;
        await notifyDueSoon(
          borrow.borrowerId._id,
          borrow.bookId?.title,
          dueDate,
          borrow._id
        );
      }
    }

    console.log(`✅ Sent ${overdueCount} overdue notifications`);
    console.log(`✅ Sent ${dueSoonCount} due soon notifications`);
  } catch (error) {
    console.error('❌ Error checking due dates:', error);
  }
};
