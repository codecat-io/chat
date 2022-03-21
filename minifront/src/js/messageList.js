import {formatTime} from '/js/utils.js';
import {html, useState, useEffect, useRef} from './utils.js';
import {watchMessages} from '/js/store/messages.js';
import {buildHtmlFromMessage} from '/js/formatter.js';
import {Message} from '/js/message.js';


export function MessageList (props) {
  const [messages, setMessages] = useState([]);

  const list = useRef(null);

  useEffect(() => {
    list.current.scrollTo(0,list.current.scrollHeight);
  }, [messages]);

  watchMessages((m) => setMessages(m || []));

  return html`
    <div class="message-list" ref=${list}>
      ${messages.map(msg => Message({class: msg.private ? ['private'] : [], 'data-id': msg.id}, {
        author: msg.user?.name || 'Guest',
        content: buildHtmlFromMessage(msg.message),
        date: formatTime(msg.createdAt),
      }))}
    </div>
  `;
}
