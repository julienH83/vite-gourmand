import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Bonjour ! Je suis l\'assistant Vite & Gourmand. Posez-moi vos questions sur nos menus, tarifs ou prestations.',
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai', {
        type: 'chat',
        data: {
          message: text,
          conversationHistory: [...messages, userMsg].filter(m => m !== WELCOME_MESSAGE),
        },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erreur');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Désolé, une erreur est survenue. Réessayez ou contactez-nous directement.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-widget__panel" role="dialog" aria-label="Chat assistant">
          <div className="chat-widget__header">
            <span className="chat-widget__header-title">Assistant V&G</span>
            <button
              className="chat-widget__close"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le chat"
              type="button"
            >
              &times;
            </button>
          </div>

          <p className="ai-disclaimer">Réponses basées sur nos menus et données réelles.</p>

          <div className="chat-widget__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-widget__msg chat-widget__msg--${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="chat-widget__msg chat-widget__msg--assistant">
                <span className="typing-indicator">
                  <span></span><span></span><span></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-widget__input-bar">
            <input
              ref={inputRef}
              type="text"
              className="chat-widget__input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre question..."
              disabled={loading}
              aria-label="Message"
            />
            <button
              className="chat-widget__send"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              type="button"
              aria-label="Envoyer"
            >
              &#10148;
            </button>
          </div>
        </div>
      )}

      <button
        className="chat-widget__bubble"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        type="button"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
