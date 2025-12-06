// shared/events/listeners/EmailListener.js
import eventBus from '../EventBus.js';
import EventTypes from '../EventTypes.js';
import { sendVerifyEmail } from '../../utils/sendVerifyEmail.js';

/**
 * EmailListener - Sends emails in background
 * Listens to domain events and sends appropriate emails
 */

// Listen for user.registered
eventBus.on(EventTypes.USER_REGISTERED, async (data) => {
  try {
    if (data.email && data.verificationToken) {
      await sendVerifyEmail(data.email, data.verificationToken);
      console.log(`✅ Verification email sent to ${data.email}`);
    }
  } catch (error) {
    console.error('❌ Email failed for user.registered:', error.message);
  }
});

// Listen for borrow.created (notify owner via email)
eventBus.on(EventTypes.BORROW_CREATED, async (data) => {
  try {
    // Email sending logic would go here
    // await sendEmail(data.ownerEmail, 'New Borrow Request', emailTemplate);
    console.log(`📧 Would send borrow request email to owner`);
  } catch (error) {
    console.error('❌ Email failed for borrow.created:', error.message);
  }
});

// Listen for borrow.approved (notify borrower via email)
eventBus.on(EventTypes.BORROW_APPROVED, async (data) => {
  try {
    // Email sending logic would go here
    console.log(`📧 Would send approval email to borrower`);
  } catch (error) {
    console.error('❌ Email failed for borrow.approved:', error.message);
  }
});

console.log('👂 EmailListener registered for user and borrow events');
