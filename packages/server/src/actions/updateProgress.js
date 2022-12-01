const Joi = require('joi');
const { messageRepo, channelProgressRepo, channelRepo } = require('../infra/database');
const { MissingChannel, AccessDenied } = require('../common/errors');
const ChannelHelper = require('../common/channel');

module.exports = {
  type: 'updateProgress',
  schema: {
    body: Joi.object({
      messageId: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const msg = req.body;

    if (!msg.messageId) throw MissingChannel(); //FIXME

    const message = await messageRepo.get({ id: msg.messageId });
    const channel = await channelRepo.get({ cid: message.channel });

    if (!await ChannelHelper.haveAccess(req.userId, channel.cid)) {
      throw AccessDenied();
    }
    await channelProgressRepo.upsert({
      userId: req.userId,
      channelId: channel.id,
      lastMessageId: msg.messageId,
      lastRead: message.createdAt,
    });

    const myProgress = await channelProgressRepo.get({ channelId: channel.id, userId: req.userId });
    res.broadcast({ type: 'progress', ...myProgress });
    res.ok({ });
  },
};
