const db = require('../../infra/database');
const bus = require('../../infra/bus');

module.exports = {
  messageSent: async (channelId, messageId, userId) => {
    const message = await db.message.get({ id: messageId });
    if (!message) {
      // eslint-disable-next-line no-console
      console.debug('messageSent: message not found', messageId);
      return;
    }
    await db.badge.increment({ channelId });
    const other = await db.badge.getAll({ channelId });
    other.filter((badge) => badge.userId !== userId).forEach((badge) => {
      bus.direct(badge.userId, { type: 'badge', ...badge });
    });
    await db.badge.upsert({
      userId,
      channelId,
      lastMessageId: messageId,
      lastRead: message.createdAt,
      count: 0,
    });
    const badge = await db.badge.get({ channelId, userId });
    bus.broadcast({ type: 'badge', ...badge });
  },
};
