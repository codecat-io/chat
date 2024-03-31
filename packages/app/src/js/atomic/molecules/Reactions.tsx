import { useDispatch } from 'react-redux';
import { useMessageData } from '../../contexts/message';
import { Emoji } from '../../atomic/molecules/Emoji';
import { Tag } from '../../atomic/atoms/Tag';

export const Reactions = () => {
  const { id, reactions = [] } = useMessageData();
  const dispatch: any = useDispatch();

  const reactionMap = reactions
    .reduce<{[reaction: string]: number}>((acc, r) => ({ ...acc, [r.reaction]: (acc[r.reaction] || 0) + 1 }), {});
  return (
    <div>
      {Object.entries(reactionMap).map(([key, count]) => (
          <Tag key={key} onClick={() => dispatch.methods.messages.addReaction(id, key)}> 
            {count > 1 ? `${count} ` : ''}
            <Emoji shortname={key} />
          </Tag>
      ))}
    </div>
  );
};
