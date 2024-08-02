import { client } from '../core';
import { createCounter } from '../utils';
import {
  createMethod, StateType, DispatchType, ActionsType,
} from '../store';
import { Stream, Message } from '../types';
import { SerializeInfo, processUrls } from '../serializer';
import { IncommingError, OutgoingCommandExecute, OutgoingMessageCreate } from '../core/types';

declare global {
  const APP_VERSION: string;
}

const tempId = createCounter(`temp:${(Math.random() + 1).toString(36)}`);

const loading = (dispatch: DispatchType, actions: ActionsType) => {
  dispatch(actions.messages.loading());
  const timer = setTimeout(() => dispatch(actions.messages.loadingDone()), 1000);
  return () => {
    dispatch(actions.messages.loadingDone());
    clearTimeout(timer);
  };
};

const getStreamMessages = (stream: Stream, messages: Message[]) => messages
  .filter((m) => m.channelId === stream.channelId
    && (
      ((!stream.parentId && !m.parentId) || m.parentId === stream.parentId)
    || (!stream.parentId && m.parentId === m.id)));

export const selectors = {
  countMessagesInStream: (stream: Stream, state: StateType) => getStreamMessages(stream, state.messages.data).length,
  getLatestDate: (stream: Stream, state: StateType) => {
    const data = getStreamMessages(stream, state.messages.data)
      .filter((m) => m.id !== stream.parentId);
    return data.length ? data[0].createdAt : new Date().toISOString();
  },
  getEarliestDate: (stream: Stream, state: StateType) => {
    const data = getStreamMessages(stream, state.messages.data)
      .filter((m) => m.id !== stream.parentId);
    return data.length ? data[data.length - 1].createdAt : new Date().toISOString();
  },
  getMessage: (id: string, state: StateType): Message | null => state.messages.data
    .find((m) => m.id === id || m.clientId === id) || null,
};

export const loadPrevious = createMethod('messages/loadPrevious', async (stream: Stream, {
  dispatch, getState, methods, actions,
}) => {
  if (getState().messages.loading) return;
  const loadingDone = loading(dispatch, actions);
  const date = selectors.getEarliestDate(stream, getState());

  await dispatch(methods.messages.load({
    ...stream,
    before: date,
  }));
  if (selectors.countMessagesInStream(stream, getState()) > 100) {
    setTimeout(() => {
      dispatch(actions.messages.takeOldest({ stream, count: 100 }));
    }, 10);
  }
  loadingDone();
});

export const loadNext = createMethod('messages/loadNext', async (stream: Stream, {
  dispatch, getState, methods, actions,
}): Promise<number | null> => {
  if (getState().messages.loading) return null;
  const loadingDone = loading(dispatch, actions);
  const date = selectors.getLatestDate(stream, getState());

  const messages = await dispatch(methods.messages.load({
    ...stream,
    after: date,
  })).unwrap();
  if (messages?.length > 0) {
    dispatch(methods.progress.update(messages[0].id));
  }
  if (selectors.countMessagesInStream(stream, getState()) > 100) {
    setTimeout(() => {
      dispatch(actions.messages.takeYoungest({ stream, count: 100 }));
    }, 10);
  }
  loadingDone();
  return messages.length;
});

export const loadMessagesArchive = createMethod('messages/loadMessagesArchive', async (stream: Stream, { dispatch, actions, methods }) => {
  if (!stream.channelId) return;
  const { date } = stream;
  const loadingDone = loading(dispatch, actions);
  dispatch(actions.messages.clear({ stream }));
  await dispatch(methods.messages.load({
    ...stream,
    before: date,
  }));
  const messages = await dispatch(methods.messages.load({
    ...stream,
    after: date,
  })).unwrap();
  if (messages?.length > 0) dispatch(methods.progress.update(messages[0].id));
  loadingDone();
});

export const loadMessagesLive = createMethod('messages/loadMessagesLive', async (stream: Stream, { dispatch, actions, methods }) => {
  if (!stream.channelId) return;
  const loadingDone = loading(dispatch, actions);
  const messages = await dispatch(methods.messages.load(stream)).unwrap();
  if (messages?.length > 0) dispatch(methods.progress.update(messages[0].id));
  loadingDone();
});

export const loadMessages = createMethod('messages/loadMessages', async (stream: Stream, { dispatch }) => {
  if (stream.type === 'archive') {
    dispatch(loadMessagesArchive(stream));
  } else {
    dispatch(loadMessagesLive(stream));
  }
});

type SendArgs = {
  stream: Stream;
  payload: OutgoingMessageCreate | OutgoingCommandExecute;
};

export const send = createMethod('messages/send', async ({ stream, payload }: SendArgs, { dispatch }) => {
  if (payload.type === 'message:create') {
    dispatch(sendMessage({ payload, info: null }));
  }
  if (payload.type === 'command:execute') {
    dispatch(sendCommand({ stream, payload }));
  }
});

const isError = (err: unknown): err is IncommingError => (err as IncommingError).status === 'error';

export const sendCommand = createMethod('messages/sendCommand', async ({ stream, payload: msg }: {payload: OutgoingCommandExecute, stream: Stream}, { dispatch, actions }) => {
  const notif = {
    type: 'notif',
    userId: getState().me,
    channelId: stream.channelId,
    parentId: stream.parentId,
    notifType: 'info',
    notif: `${msg.name} sent`,
    createdAt: (new Date()).toISOString(),
  };
  msg.context = { ...stream, appVersion: APP_VERSION };
  dispatch(actions.messages.add(notif));
  try {
    await client.notif(msg);
    dispatch(actions.messages.add({ ...notif, notifType: 'success', notif: `${msg.name} executed successfully` }));
  } catch (err) {
    // eslint-disable-next-line no-console
    if (!isError(err)) return console.error(err);
    dispatch(actions.messages.add({ ...notif, notifType: 'error', notif: `${msg.name} error ${err.res.message || err.message}` }));
  }
});

type MessageInfo = null | {
  msg: string;
  type: string;
  action?: string;
}

const sendMessage = createMethod('messages/sendMessage', async ({ payload: msg, info }: {payload: OutgoingMessageCreate, info: MessageInfo}, { dispatch, actions, getState }) => {
  dispatch(actions.messages.add({ ...msg, userId: getState().me, pending: true }));
  try {
    await client.req(msg);
  } catch (err) {
    dispatch(actions.messages.add({
      clientId: msg.clientId,
      channelId: msg.channelId,
      parentId: msg.parentId,
      info,
    }));
  }
});

export const resend = createMethod('messages/resend', async (id: string, { dispatch, getState }) => {
  const msg = selectors.getMessage(id, getState());
  if (!msg) return;
  dispatch(sendMessage({
    payload: {
      type: 'message:create',
      ...msg,
    },
    info: {
      msg: 'Resending',
      type: 'warning',
    },
  }));
});

export const removeMessage = createMethod('messages/removeMessage', async (msg: {id: string}, { dispatch, actions }) => {
  try {
    await client.notif({ type: 'message:remove', id: msg.id });
  } catch (err) {
    dispatch(actions.messages.add({
      id: msg.id,
      notifType: null,
      notif: null,
      info: {
        type: 'error',
        msg: 'Could not delete message',
      },
    }));
  }
});

type ShareMessage = {
  title?: string;
  text?: string;
  url?: string;
};

export const sendShareMessage = createMethod('messages/sendShareMessage', async (data: ShareMessage, { dispatch, getState, actions }) => {
  const { channelId, parentId } = getState().stream.main;
  const info: SerializeInfo = { links: [], mentions: [] };
  const msg: OutgoingMessageCreate = {
    type: 'message:create',
    clientId: tempId(),
    channelId,
    parentId,
    flat: `${data.title} ${data.text} ${data.url}`,
    message: buildShareMessage(data, info),
    links: [] as string[],
  };
  msg.links = info.links;
  dispatch(actions.messages.add({ ...msg, pending: true, info: null }));
  try {
    await client.notif(msg);
  } catch (err) {
    dispatch(actions.messages.add({
      clientId: msg.clientId,
      channelId: msg.channelId,
      parentId: msg.parentId,
      info: {
        msg: 'Sending message failed',
        type: 'error',
        action: 'resend',
      },
    }));
  }
});

const buildShareMessage = (data: ShareMessage, info: SerializeInfo) => {
  const lines = [];
  if (data.title) {
    lines.push({ line: { bold: processUrls(data.title, info) } });
  }
  if (data.text) {
    lines.push({ line: processUrls(data.text, info) });
  }
  if (data.url) {
    lines.push({ line: processUrls(data.url, info) });
  }
  return lines;
};
