import { useState, useRef, useEffect } from "react";
import "./App.css";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

interface Message {
  role: "user" | "model";
  text: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", text: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const body = {
        contents: updatedMessages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      };

      const res = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply: string =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? "(no response)";

      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">✦</span>
          <span className="sidebar-title">Gemini Chat</span>
        </div>
        <div className="sidebar-model">
          <span className="model-badge">gemini-3.8-flash</span>
        </div>
        <div className="sidebar-actions">
          <button
            className="new-chat-btn"
            onClick={() => {
              setMessages([]);
              setError("");
            }}
          >
            + New Chat
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        <div className="messages-area">
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h2>How can I help you today?</h2>
              <p>Ask me anything — I'm powered by Gemini.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role}`}>
              <div className="avatar">
                {msg.role === "user" ? "U" : "✦"}
              </div>
              <div className="bubble">
                <pre className="bubble-text">{msg.text}</pre>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row model">
              <div className="avatar">✦</div>
              <div className="bubble">
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              ⚠ {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-bar">
          <div className="input-wrapper">
            <textarea
              rows={1}
              placeholder="Message Gemini… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
