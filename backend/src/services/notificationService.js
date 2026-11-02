const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');

const createNotification = async ({
  recipient,
  sender = null,
  title,
  message,
  type = 'system_alert',
  priority = 'medium',
  link = '',
  referenceId = null,
  referenceModel = null,
}) => {
  try {
    if (!recipient) return null;

    const notification = await Notification.create({
      recipient,
      sender,
      title,
      message,
      type,
      priority,
      link,
      referenceId,
      referenceModel,
      isRead: false,
    });

    // Real-time socket dispatch to the recipient's personal room
    emitToUser(recipient, 'notification_received', notification);

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

const notifyMany = async (recipients, notificationData) => {
  if (!Array.isArray(recipients) || recipients.length === 0) return;
  const promises = recipients.map((rId) =>
    createNotification({ ...notificationData, recipient: rId })
  );
  return await Promise.allSettled(promises);
};

module.exports = {
  createNotification,
  notifyMany,
};

