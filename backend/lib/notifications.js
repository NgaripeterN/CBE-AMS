const prisma = require('./prisma');

const createNotification = async (userId, message) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });
    console.log(`Notification created for user ${userId}: ${message}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  createNotification,
};
