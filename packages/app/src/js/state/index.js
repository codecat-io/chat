import { configureStore, createSelector, createAction } from '@reduxjs/toolkit'
import messages, { actions as messageActions } from './messages';
import connected, { actions as connectionActions } from './connection';
import config, { actions as configActions } from './config';
import channels, { actions as channelActions } from './channels';
import users, { actions as userActions } from './users';
import info, { actions as infoActions } from './info';
import files, { actions as fileActions, filesAreReady } from './files';
import typing, { actions as typingActions } from './typing';
import view, { actions as viewActions } from './view';
import search, { actions as searchActions } from './search';
import pins, { actions as pinActions } from './pins';
import system, { actions as systemActions } from './system';
import customEmojis, { actions as cusotmEmojisActions } from './customEmojis';
import progress, { actions as progressActions } from './progress';

const logout = createAction('logout');

export const actions = {
  logout,
  ...messageActions,
  ...connectionActions,
  ...configActions,
  ...channelActions,
  ...userActions,
  ...infoActions,
  ...fileActions,
  ...typingActions,
  ...viewActions,
  ...searchActions,
  ...pinActions,
  ...systemActions,
  ...cusotmEmojisActions,
  ...progressActions,
}

export const selectors = {
  getProgress: (channel) => createSelector(
    (state) => state.channels.list.find((c) => c.id === channel),
    (state) => state.progress,
    (state) => state.users.list,
    (channel, progress, users) => (channel ? progress
      .filter((p) => p.channelId === channel.id)
      .map((p) => ({
        ...p,
        user: users.find((u) => u.id === p.userId),
      }))
      .reduce((acc, p) => ({
        ...acc,
        [p.lastMessageId]: [...(acc[p.lastMessageId] || []), p],
      }), {}) : {}),
  ),
  getBadges: (userId) => createSelector(
    (state) => state.progress,
    (progress) => progress
      .filter((p) => p.userId === userId)
      .reduce((acc, p) => ({
        ...acc,
        [p.channelId]: p.count,
      }), {}),
  ),
  getEmoji: (shortname) => (state) => state.customEmojis
    .find((emoji) => emoji.shortname === shortname),
  getAllEmojis: () => (state) => state.customEmojis,
  getChannel: (q) => (state) => state.channels.list
    .find((c) => c.id === q.id || c.name === q.name),
  getChannels: (state) => state.channels.list,
  getConfig: (state) => state.config,
  getCid: (state) => state.channels.current,
  getChannelId: createSelector(
    (state) => state.channels.current,
    (state) => state.channels.list,
    (channelId, channels) => channels.find((c) => c.id === channelId)?.id,
  ),
  getMeId: (state) => state.users.meId,
  getMyId: (state) => state.users.meId,
  getFiles: (state) => state.files.list,
  getView: (state) => state.view.current,
  getSearchResults: (state) => state.search.results,
  getPinnedMessages: (channel) => (state) => state.pins.data[channel] || [],
  getMessages: createSelector(
    (state) => state.channels.current,
    (state) => state.messages.data,
    (channel, messages) => messages[channel] || [],
  ),
  getMessagesStatus: (state) => state.messages.status,
  getHoveredMessage: (state) => state.messages.hovered,
  getInitFailed: (state) => state.system.initFailed,
  getMessagesLoadingFailed: (state) => state.messages.loadingFailed,
  getMessagesLoading: (state) => state.messages.loading
    || state.messages.loadingPrevious
    || state.messages.loadingNext,
  getMessagesPrevLoading: (state) => state.messages.loading || state.messages.loadingPrevious,
  getMessagesNextLoading: (state) => state.messages.loading || state.messages.loadingNext,
  getSelectedMessage: (state) => state.messages.selected,
  countMessagesInChannel: (channel, state) => state.messages.data[channel]?.length || 0,
  getLatestDate: () => createSelector(
    (state) => state.channels.current,
    (state) => state.messages.data,
    (channel, messages) => (messages[channel][0]
      ? messages[channel][0].createdAt
      : new Date().toISOString()),
  ),
  getEarliestDate: () => createSelector(
    (state) => state.channels.current,
    (state) => state.messages.data,
    (channel, messages) => (messages[channel][messages[channel].length - 1]
      ? messages[channel][messages[channel].length - 1].createdAt
      : new Date().toISOString()),
  ),
  getMessage: (id) => createSelector(
    (state) => state.channels.current,
    (state) => state.messages.data,
    (channel, messages) => messages[channel]
      .find((m) => (m.id && m.id === id)
        || (m.clientId && m.clientId === id)),
  ),
  getCurrentChannel: createSelector(
    (state) => state.channels.list,
    (state) => state.channels.current,
    (list, channelId) => list.find((c) => c.id === channelId) || {id: channelId},
  ),
  getInfo: (state) => state.info,
  getUser: (userId) => createSelector(
    (state) => state.users.list.find((user) => user.id === userId),
    (state) => state.users.list.find((user) => user.id === 'system'),
    (user, system) => user || system,
  ),
  filesAreReady: createSelector(
    (state) => state.files,
    filesAreReady,
  ),

  getTyping: () => createSelector(
    (state) => state.channels.current,
    (state) => state.typing,
    (state) => state.users.list,
    (channelId, typing, users) => Object.keys(typing[channelId] || {})
      .map((id) => users.find((u) => u.id === id)),
  ),
}

export default configureStore({
  devTools: true,
  reducer: {
    config,
    connected,
    messages,
    users,
    channels,
    info,
    files,
    typing,
    view,
    search,
    pins,
    system,
    customEmojis,
    progress,
  },
})
