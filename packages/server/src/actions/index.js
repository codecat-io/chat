module.exports = {
  auth: require('./auth'),
  connection: require('./connection'),
  greet: require('./greet'),
  load: require('./load'),
  initUpload: require('./initUpload'),
  finalizeUpload: require('./finalizeUpload'),
  initDownload: require('./initDownload'),
  ping: require('./ping'),
  restore: require('./restore'),
  typing: require('./typing'),
  setupPushNotifications: require('./setupPushNotifications'),
  setupFcm: require('./setupFcm'),
  channels: require('./channels'),
  createChannel: require('./createChannel'),
  removeChannel: require('./removeChannel'),
  removeMessage: require('./removeMessage'),
  message: require('./message'),
  command: require('../commands'),
};
