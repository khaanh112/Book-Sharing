import nodemailer from "nodemailer";
import User from "../models/User.js";

/**
 * Gửi email notification
 */
export const sendNotificationEmail = async (userId, { type, title, message, bookTitle, senderName }) => {
  try {
    // Lấy thông tin user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for notification email');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Template email dựa trên loại notification
    const emailTemplates = {
      borrow_request_new: {
        subject: `📚 New Borrow Request from ${senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">New Borrow Request</h2>
            <p>Hi ${user.name},</p>
            <p><strong>${senderName}</strong> wants to borrow your book:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0; color: #333;">${bookTitle}</h3>
            </div>
            <p>Please log in to your account to accept or reject this request.</p>
            <a href="${process.env.FRONTEND_URL}/my-requests" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View Request</a>
          </div>
        `
      },
      borrow_request_accepted: {
        subject: `✅ Your Borrow Request Accepted`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Request Accepted!</h2>
            <p>Hi ${user.name},</p>
            <p>Good news! <strong>${senderName}</strong> accepted your request to borrow:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0; color: #333;">${bookTitle}</h3>
            </div>
            <p>You can now arrange to pick up the book.</p>
            <a href="${process.env.FRONTEND_URL}/my-borrows" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View Details</a>
          </div>
        `
      },
      borrow_request_rejected: {
        subject: `❌ Your Borrow Request Rejected`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f44336;">Request Rejected</h2>
            <p>Hi ${user.name},</p>
            <p><strong>${senderName}</strong> rejected your request to borrow:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0; color: #333;">${bookTitle}</h3>
            </div>
            <p>Don't worry, there are many other books available!</p>
            <a href="${process.env.FRONTEND_URL}/books" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Browse Books</a>
          </div>
        `
      },
      borrow_due_soon: {
        subject: `⏰ Reminder: Book Due Soon`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF9800;">Reminder: Book Due Soon</h2>
            <p>Hi ${user.name},</p>
            <p>${message}</p>
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF9800;">
              <h3 style="margin: 0; color: #333;">${bookTitle}</h3>
            </div>
            <p>Please return the book on time to maintain a good borrowing record.</p>
            <a href="${process.env.FRONTEND_URL}/my-borrows" style="display: inline-block; padding: 10px 20px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px;">View Borrow</a>
          </div>
        `
      },
      borrow_overdue: {
        subject: `🚨 Book Overdue - Please Return`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f44336;">⚠️ Book Overdue</h2>
            <p>Hi ${user.name},</p>
            <p>${message}</p>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
              <h3 style="margin: 0; color: #333;">${bookTitle}</h3>
            </div>
            <p><strong>Please return the book as soon as possible.</strong></p>
            <a href="${process.env.FRONTEND_URL}/my-borrows" style="display: inline-block; padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">View Borrow</a>
          </div>
        `
      },
      book_returned: {
        subject: `📖 Book Returned`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Book Returned</h2>
            <p>Hi ${user.name},</p>
            <p><strong>${senderName}</strong> has returned your book:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0; color: #333;">${bookTitle}</h3>
            </div>
            <p>Thank you for sharing your book!</p>
            <a href="${process.env.FRONTEND_URL}/my-books" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View My Books</a>
          </div>
        `
      }
    };

    const template = emailTemplates[type];
    if (!template) {
      console.log('Unknown notification type:', type);
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: template.subject,
      html: template.html
    });

    console.log(`✅ Notification email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending notification email:', error);
    // Không throw error để không block việc tạo notification
  }
};
