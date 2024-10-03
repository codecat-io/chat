import { useMemo } from 'react';
import { useSelector } from './useSelector';
import { useUsers } from './useUsers';
import { Progress, User } from '../../types';

type UserProgress = Progress & { user: User };

export const useProgress = ({ channelId, parentId }: {channelId: string, parentId?: string}) => {
  const channels = useSelector((state) => state.channels);
  const users = useUsers();
  const progress = useSelector((state) => state.progress);

  const channel = useMemo(() => Object.values(channels).find((c) => c.id === channelId), [channels, channelId]);

  return useMemo(() => (channel ? progress
    .filter((p) => Boolean(p))
    .filter((p) => p.channelId === channel.id)
    .filter((p) => (!p.parentId && !parentId) || p.parentId === parentId)
    .map((p) => ({
      ...p,
      user: users.find((u) => u.id === p.userId),
    }))
    .reduce<Record<string, UserProgress[]>>((acc, p) => ({
      ...acc,
      [p.lastMessageId]: [...(acc[p.lastMessageId] || []), p] as UserProgress[],
    }), {}) : {}), [channel, progress, parentId, users]);
};
