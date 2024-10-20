import { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  useDispatch, useSelector, useProgress, useMethods,
} from '../../store';
import { MessageList } from './MessageListScroller';
import { uploadMany } from '../../services/file';
import { Input } from './Input';
import { reinit } from '../../services/init';
import { HoverProvider } from '../contexts/hover';
import { useMessages } from '../contexts/useMessages';
import { LoadingIndicator } from '../molecules/LoadingIndicator';
import { Message as MessageType } from '../../types';
import { useMessageListArgs } from '../contexts/useMessageListArgs';

const ReInit = styled.div`
  cursor: pointer;
  border: 0;
  text-align: center;
  color: var(--color_danger);
  vertical-align: middle;
  height: 50px;
  line-height: 25px;
  border-top: 1px solid var(--border_color);
  &:hover {
    background-color: var(--secondary_background);
  }
`;

type InitFailedButtonProps = {
  onClick?: () => void;
};

export const InitFailedButton = ({ onClick }: InitFailedButtonProps) => (
  <ReInit onClick={onClick}>
    Failed to initialize<br />
    Click to retry...
  </ReInit>
);

export const Container = styled.div`
  flex: 1;
  width: 100%;
  height: calc(100% - 50px);
  display: flex;
  flex-direction: column;
`;

export function Conversation({channelId, parentId}: {channelId: string, parentId?: string}) {
  const [args, setArgs] = useMessageListArgs();
  const dispatch = useDispatch();
  const methods = useMethods();
  const { messages, next, prev } = useMessages({channelId, parentId});
  const initFailed = useSelector((state) => state.system.initFailed);
  const progress = useProgress({ channelId: channelId, parentId: parentId });
  const list: MessageType[] = messages.map((m: MessageType) => ({ ...m, progress: progress[m.id ?? ''] }));

  const drop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;

    dispatch(uploadMany({ streamId: args.id, files }));
  }, [dispatch, channelId, parentId]);

  const dragOverHandler = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
  }, []);

  const bumpProgress = useCallback(() => {
    const latest = list.find(({ priv }) => !priv);
    if (latest?.id) dispatch(methods.progress.update(latest.id));
  }, [methods, list, dispatch]);

  useEffect(() => {
    window.addEventListener('focus', bumpProgress);
    return () => {
      window.removeEventListener('focus', bumpProgress);
    };
  }, [bumpProgress]);
  return (
    <Container onDrop={drop} onDragOver={dragOverHandler}>
      <HoverProvider>
        <MessageList
          list={list}
          onDateChange={(date) => setArgs({ ...args, date })}
          onScrollTop={async () => {
            await prev();
            setArgs({ ...args, type: 'archive', selected: undefined });
            bumpProgress();
          }}
          onScrollBottom={async () => {
            const count = await next();
            if (count === 1) {
              setArgs({ ...args, type: 'live', selected: undefined });
            }
            bumpProgress();
          }}
        />
        <LoadingIndicator />
        <Input channelId={channelId} parentId={parentId}/>
        {initFailed && <InitFailedButton onClick={() => dispatch(reinit({}))} />}
      </HoverProvider>
    </Container>
  );
}

