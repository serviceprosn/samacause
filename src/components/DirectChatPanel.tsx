import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DirectMessage, User } from '../types';

interface DirectChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectChatPanel: React.FC<DirectChatPanelProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    usersList,
    directMessages,
    sendDirectMessage,
    activeChatUserId,
    setActiveChatUserId,
    setSelectedPublicUserId
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChatUserId && isOpen) {
      scrollToBottom();
    }
  }, [directMessages, activeChatUserId, isOpen]);

  if (!isOpen) return null;

  // Filter users by search query
  const filteredUsers = usersList.filter(u => {
    if (currentUser && u.id === currentUser.id) return false;
    return u.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper to find the last message with a user
  const getLastMessage = (userId: string): DirectMessage | undefined => {
    if (!currentUser) return undefined;
    const conversationMsgs = directMessages.filter(msg => 
      (msg.senderId === currentUser.id && msg.receiverId === userId) ||
      (msg.senderId === userId && msg.receiverId === currentUser.id)
    );
    return conversationMsgs.length > 0 ? conversationMsgs[conversationMsgs.length - 1] : undefined;
  };

  // Get count of unread messages from a user
  const getUnreadCount = (userId: string): number => {
    if (!currentUser) return 0;
    return directMessages.filter(msg => 
      msg.senderId === userId && msg.receiverId === currentUser.id && !msg.read
    ).length;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUserId || !inputText.trim()) return;

    sendDirectMessage(activeChatUserId, inputText);
    setInputText('');
  };

  const activeChatUser = usersList.find(u => u.id === activeChatUserId);
  const activeConversationMsgs = currentUser && activeChatUser
    ? directMessages.filter(msg => 
        (msg.senderId === currentUser.id && msg.receiverId === activeChatUser.id) ||
        (msg.senderId === activeChatUser.id && msg.receiverId === currentUser.id)
      )
    : [];

  return (
    <div className={`ai-assistant-drawer ${isOpen ? 'open' : ''}`} style={{ zIndex: 1005 }}>
      {/* 1. Header Area */}
      <div 
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--primary)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {activeChatUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="btn btn-ghost" 
              style={{ padding: '0.2rem 0.4rem', color: 'white', minWidth: 'auto', marginRight: '0.25rem' }} 
              onClick={() => setActiveChatUserId(null)}
              title="Retour aux discussions"
            >
              ←
            </button>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundImage: `url(${activeChatUser.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer',
                border: '1.5px solid white'
              }}
              onClick={() => {
                setSelectedPublicUserId(activeChatUser.id);
              }}
            />
            <div>
              <h3 
                style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setSelectedPublicUserId(activeChatUser.id)}
              >
                {activeChatUser.name} {activeChatUser.verified && '✓'}
              </h3>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)' }}>
                Trust Score: {activeChatUser.trustScore}%
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>💬</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Discussions Citoyennes</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--secondary)' }}>Échanges directs entre visiteurs</span>
            </div>
          </div>
        )}
        <button 
          className="btn btn-ghost" 
          style={{ padding: '0.2rem 0.4rem', color: 'white', fontSize: '1.1rem' }} 
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* 2. Main Body Content */}
      {!currentUser ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: 'var(--light)' }}>
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</span>
          <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Connexion requise</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', maxWidth: '280px', margin: '0 0 1.5rem' }}>
            Vous devez être connecté avec votre compte citoyen pour échanger des messages privés avec la communauté.
          </p>
        </div>
      ) : activeChatUser ? (
        // Chat messaging view
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--light)', overflow: 'hidden' }}>
          {/* Scrollable messages container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {activeConversationMsgs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary-light)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Aucun message précédent. Envoyez le premier mot pour démarrer la discussion !
              </div>
            ) : (
              activeConversationMsgs.map((msg) => {
                const isSentByMe = msg.senderId === currentUser.id;
                return (
                  <div 
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isSentByMe ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <div 
                      style={{
                        maxWidth: '85%',
                        padding: '0.75rem 1rem',
                        borderRadius: '16px',
                        borderBottomLeftRadius: isSentByMe ? '16px' : '2px',
                        borderBottomRightRadius: isSentByMe ? '2px' : '16px',
                        background: isSentByMe ? 'var(--primary)' : 'var(--light-card)',
                        color: isSentByMe ? 'white' : 'var(--text-primary-light)',
                        border: isSentByMe ? 'none' : '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)', marginTop: '0.2rem', padding: '0 0.25rem' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form message input */}
          <form 
            onSubmit={handleSendMessage}
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--border-light)',
              background: 'var(--light-card)',
              display: 'flex',
              gap: '0.5rem'
            }}
          >
            <input 
              type="text"
              required
              placeholder="Écrire un message..."
              className="premium-card"
              style={{ flex: 1, padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)' }}
              disabled={!inputText.trim()}
            >
              Envoyer
            </button>
          </form>
        </div>
      ) : (
        // Contacts / Active conversations list
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--light)', overflow: 'hidden' }}>
          {/* Contacts Search Bar */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', background: 'var(--light-card)' }}>
            <input 
              type="text"
              placeholder="Rechercher un citoyen ou organisateur..."
              className="premium-card"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Contacts Directory */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary-light)', fontSize: '0.8rem' }}>
                Aucun utilisateur trouvé correspondant à votre recherche.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const lastMsg = getLastMessage(user.id);
                const unreadCount = getUnreadCount(user.id);
                return (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.9rem 1.25rem',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      background: 'var(--light-card)',
                      transition: 'background 0.2s ease'
                    }}
                    onClick={() => setActiveChatUserId(user.id)}
                    className="hover-scale"
                  >
                    <div 
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundImage: `url(${user.avatar})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}
                    >
                      <span 
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: user.verified ? 'var(--primary)' : '#9ca3af',
                          border: '1.5px solid white'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          {user.name} {user.verified && <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>✓</span>}
                        </h4>
                        {lastMsg && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)' }}>
                            {lastMsg.timestamp}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p 
                          style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: unreadCount > 0 ? 'var(--text-primary-light)' : 'var(--text-secondary-light)',
                            fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '190px'
                          }}
                        >
                          {lastMsg ? lastMsg.text : `${user.role} - K Score: ${user.trustScore}%`}
                        </p>

                        {unreadCount > 0 && (
                          <span 
                            style={{
                              background: 'var(--danger)',
                              color: 'white',
                              borderRadius: '50%',
                              padding: '0.15rem 0.4rem',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              minWidth: '16px',
                              textAlign: 'center'
                            }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
