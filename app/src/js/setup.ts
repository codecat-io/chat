import { play } from './services/sound';
import { sendShareMessage } from './services/messages';
import { init } from './services/init';
import { client } from './core';
import { store, actions, methods } from './store';
import { Notification } from './types';

let sound = false;

client
  .on('share', ({ data }) => store.dispatch(sendShareMessage(data)))
  .on('user', (msg) => store.dispatch(actions.users.add(msg)))
  .on('emoji', (msg) => store.dispatch(actions.emojis.add({ ...msg, category: 'c' })))
  .on('badge', (msg) => store.dispatch(actions.progress.add(msg)))
  .on('channel', (msg) => store.dispatch(actions.channels.add(msg)))
  .on('removeChannel', (msg) => store.dispatch(actions.channels.remove(msg.channelId)))
  .on('typing', (msg) => store.dispatch(methods.typing.ack(msg)))
  .on('con:open', () => store.dispatch(init({})))
  .on('auth:user', (user) => store.dispatch(actions.me.set(user)))
  .on('auth:logout', () => store.dispatch(actions.me.set(null)))
  .on('con:close', () => {
    store.dispatch(actions.connection.disconnected());
    store.dispatch(actions.info.show({
      message: 'Connecting...',
      type: 'info',
    }));
  })
  // FIXME: temporal fix for mesages not refreshing after some time
  .on('win.visible', () => store.dispatch(async (dispatch, getState) => {
    await dispatch(methods.messages.load(getState().stream.main));
  }))
  .on('message', (msg) => {
    if (sound) {
      play();
    }
    store.dispatch(actions.messages.add({ ...msg, pending: false }));
  })
  .on('message:remove', (msg) => store.dispatch(actions.messages.rm(msg)))
  .on('notification', () => { try { play(); } catch (err) { /* ignore */ } })
  .on('notification', () => { try { navigator.vibrate([100, 30, 100]); } catch (err) { /* ignore */ } })
  .on('notification:click', (e: Notification) => {
    store.dispatch(actions.stream.open({
      id: 'main',
      value: {
        type: 'archive',
        date: e.createdAt,
        selected: e.messageId,
        channelId: e.channelId,
        parentId: e.parentId,
      },
    }));
  });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    sound = true;
  } else {
    sound = false;
  }
});

