/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL AI CHATBOT - REACT COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A floating chat widget for the Sentinel Supply Chain platform.
 * Features:
 * - Floating bubble in bottom-right corner
 * - Expandable chat window
 * - Real-time AI responses
 * - Auto-scroll to latest messages
 * - Loading states and error handling
 * - 🔒 Requires authentication to use
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChatBot.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat/ask`;

/**
 * Simple Markdown Parser for Chat Messages
 * Converts markdown text to React elements
 */
const parseMarkdown = (text) => {
  if (!text) return null;
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map((paragraph, pIndex) => {
    // Check if this is a list (starts with - or * or numbers)
    const lines = paragraph.split('\n');
    const isList = lines.some(line => /^[\s]*[-*•][\s]+/.test(line) || /^[\s]*\d+\.[\s]+/.test(line));
    
    if (isList) {
      const listItems = lines
        .filter(line => line.trim())
        .map((line, lIndex) => {
          // Remove bullet points/numbers
          const cleanLine = line.replace(/^[\s]*[-*•\d.]+[\s]+/, '');
          return <li key={lIndex}>{parseInlineMarkdown(cleanLine)}</li>;
        });
      return <ul key={pIndex} className="markdown-list">{listItems}</ul>;
    }
    
    // Regular paragraph
    const lineElements = lines.map((line, lIndex) => (
      <React.Fragment key={lIndex}>
        {parseInlineMarkdown(line)}
        {lIndex < lines.length - 1 && <br />}
      </React.Fragment>
    ));
    
    return <p key={pIndex} className="markdown-paragraph">{lineElements}</p>;
  });
};

/**
 * Parse inline markdown (bold, italic, code)
 */
const parseInlineMarkdown = (text) => {
  if (!text) return null;
  
  // Pattern to match **bold**, *italic*, and `code`
  const parts = [];
  let lastIndex = 0;
  
  // Combined regex for bold, italic, and code
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    if (match[1]) {
      // Bold: **text**
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      // Italic: *text*
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      // Code: `text`
      parts.push(<code key={match.index}>{match[6]}</code>);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('sentinel_token');
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * ChatBot Component
 * A floating AI-powered chat widget for supply chain assistance
 */
const ChatBot = () => {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      text: `👋 Hello! I'm Sentinel AI, your supply chain assistant.

How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Generate a unique message ID
   */
  const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ═══════════════════════════════════════════════════════════════════════
  // API FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Send a message to the AI backend
   */
  const sendMessage = useCallback(async (question) => {
    if (!question.trim()) return;

    // 🔒 Check authentication before sending
    const token = getAuthToken();
    if (!token) {
      setError('Please log in to use the chatbot.');
      const authErrorMessage = {
        id: generateMessageId(),
        type: 'bot',
        text: '🔒 **Authentication Required**\n\nYou need to be logged in to use Sentinel AI. Please log in with your wallet to continue.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, authErrorMessage]);
      return;
    }

    // Clear any previous error
    setError(null);

    // Add user message to chat
    const userMessage = {
      id: generateMessageId(),
      type: 'user',
      text: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        const authErrorMessage = {
          id: generateMessageId(),
          type: 'bot',
          text: '🔒 **Session Expired**\n\nYour session has expired. Please log in again to continue using Sentinel AI.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, authErrorMessage]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.answer || 'Failed to get response');
      }

      // Add bot response to chat
      const botMessage = {
        id: generateMessageId(),
        type: 'bot',
        text: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      
      // Add error message to chat
      const errorMessage = {
        id: generateMessageId(),
        type: 'error',
        text: err.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setError(err.message);

    } finally {
      setIsLoading(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Toggle chat window
   */
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    setError(null);
  };

  /**
   * Clear chat history
   */
  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        text: "Chat cleared! How can I help you with your supply chain needs?",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };



  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="sentinel-chatbot">
      {/* Chat Toggle Button (Floating Bubble) */}
      <button
        className={`chatbot-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        title={isOpen ? 'Close chat' : 'Chat with Sentinel AI'}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!isOpen && messages.length > 1 && (
          <span className="notification-badge" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="header-info">
              <div className="header-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <div className="header-text">
                <h3>Sentinel AI</h3>
                <span className="status-indicator">
                  <span className="status-dot" />
                  Online
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="header-btn"
                onClick={clearChat}
                title="Clear chat"
                aria-label="Clear chat history"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button
                className="header-btn close-btn"
                onClick={toggleChat}
                title="Close chat"
                aria-label="Close chat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="chatbot-messages" ref={chatContainerRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.type}`}
              >
                {message.type === 'bot' && (
                  <div className="message-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </div>
                )}
                <div className="message-content">
                  <div className="message-bubble">
                    {message.type === 'bot' ? (
                      <div className="markdown-content">{parseMarkdown(message.text)}</div>
                    ) : (
                      <p>{message.text}</p>
                    )}
                  </div>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about shipments, tracking, or supply chain..."
              disabled={isLoading}
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
