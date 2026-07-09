import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import './ChatModal.css';

const AGENT_REPLIES = [
  'תודה על פנייתך! אני בודק את זה עבורך.',
  'הבנתי. האם תוכל/י לפרט עוד קצת?',
  'אני כאן לעזור. רגע אחד בבקשה...',
  'שמח לעזור! יש עוד משהו שאוכל לסייע בו?',
];

export default function ChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'agent',
      text: 'שלום! אני נועה מצוות התמיכה של Parkit. איך אוכל לעזור?',
      time: formatTime(new Date()),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const replyIndex = useRef(0);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMessage = {
      id: Date.now(),
      from: 'user',
      text,
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const reply = AGENT_REPLIES[replyIndex.current % AGENT_REPLIES.length];
      replyIndex.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'agent',
          text: reply,
          time: formatTime(new Date()),
        },
      ]);
      setTyping(false);
    }, 1200);
  };

  return (
    <Modal title="צ'אט עם נציג" isOpen={isOpen} onClose={onClose} className="modal--chat">
      <div className="chat-modal">
        <div className="chat-modal__messages" ref={listRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-modal__bubble chat-modal__bubble--${msg.from}`}
            >
              <p>{msg.text}</p>
              <span className="chat-modal__time">{msg.time}</span>
            </div>
          ))}
          {typing && (
            <div className="chat-modal__bubble chat-modal__bubble--agent chat-modal__typing">
              <span /><span /><span />
            </div>
          )}
        </div>

        <form className="chat-modal__input-row" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-modal__input"
            placeholder="כתבו הודעה..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!input.trim() || typing}>
            <Icon icon={Send} size={16} />
          </Button>
        </form>
      </div>
    </Modal>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}
