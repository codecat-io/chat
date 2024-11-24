import { useState } from 'react';
import styled from 'styled-components';
import {
  useSelector, useBadges, useChannels, useActions, useDispatch,
} from '../../store';
import { ChannelCreate } from './ChannelCreate';
import { Channel } from './NavChannel';
import { useSidebar } from '../contexts/useSidebar';
import { isMobile } from '../../utils';
import { useNavigate, useParams } from 'react-router-dom';

const ChannelsContainer = styled.div`
  .header {
    display: flex;
    flex-direction: row;
    padding: 5px 10px;
    padding-top: 20px;
    font-weight: bold;
    .title {
      flex: 1;
    }

    i {
      cursor: pointer;
      flex: 0 15px;
      font-size: 19px;
    }

  }

  .channel {
    padding: 5px 5px 5px 20px; 
    cursor: pointer;
  }
  .channel .name {
    padding: 0px 10px; 
    cursor: pointer;
  }
  .channel.active {
    background-color: var(--primary_active_mask);
  }

  .channel:hover {
    font-weight: bold;
    background-color: ${(props) => props.theme.Channel.Hover};
    color: ${(props)=> props.theme.Channel.TextHover}
  }
`;

type NavChannelsProps = {
  icon?: string;
};

export const NavChannels = ({ icon }: NavChannelsProps) => {
  const [show, setShow] = useState(false);
  const channels = useChannels();
  let navigate = (_path: string) => {};
  try { navigate = useNavigate(); }catch {}
  const userId = useSelector((state) => state.me);
  const badges = useBadges(userId);
  console.log(badges);
  const {channelId: id} = useParams();
  const { hideSidebar } = useSidebar();
  return (
    <ChannelsContainer>
      <div className='header'>
        <span className='title'>channels</span>
        <i className={show ? 'fa-solid fa-minus' : 'fa-solid fa-plus'} onClick={() => setShow(!show)} />
      </div>
      {show && <ChannelCreate />}
      { channels && channels.map((c) => (
        <Channel
          channelId={c.id}
          {...c}
          className={{ active: id === c.id }}
          key={c.id}
          icon={icon ?? 'hash'}
          badge={badges[c.id]}
          onClick={() => {
            if ( isMobile() ) {
              hideSidebar();
            }
            navigate(`/${c.id}`);
          }}
        />
      ))}
    </ChannelsContainer>
  );
};
