import React from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, onNavigate }) => {
  const {
    currentUser,
    directMessages,
    usersList,
    petitions,
    cagnottes,
    tontines,
    markMessagesAsRead,
    setActiveChatUserId,
    setSelectedPublicUserId,
    isMobileView
  } = useApp();
  const { t } = useLanguage();

  if (!isOpen) return null;

  // Gather notifications for currentUser
  const notificationItems: Array<{
    id: string;
    type: 'message' | 'follower' | 'cause' | 'kyc';
    title: string;
    subtitle: string;
    time: string;
    isRead: boolean;
    avatar?: string;
    action: () => void;
  }> = [];

  if (currentUser) {
    // 1. Direct messages received
    const unreadDirectMessages = directMessages.filter(m => m.receiverId === currentUser.id);
    unreadDirectMessages.forEach((msg, idx) => {
      const sender = usersList.find(u => u.id === msg.senderId);
      notificationItems.push({
        id: `msg-${msg.id || idx}`,
        type: 'message',
        title: `💬 Message de ${sender?.name || 'Un membre'}`,
        subtitle: msg.text ? (msg.text.length > 50 ? `${msg.text.slice(0, 50)}...` : msg.text) : 'Vocal / Fichier reçu',
        time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Récemment',
        isRead: !!msg.read,
        avatar: sender?.avatar,
        action: () => {
          if (sender) {
            setActiveChatUserId(sender.id);
            markMessagesAsRead(sender.id);
          }
          if (onNavigate) {
            onNavigate('profile', { target: 'messages' });
          }
          onClose();
        }
      });
    });

    // 2. Followers
    const followerIds = currentUser.followers || [];
    followerIds.forEach(followerId => {
      const follower = usersList.find(u => u.id === followerId);
      if (follower) {
        notificationItems.push({
          id: `follower-${follower.id}`,
          type: 'follower',
          title: `👥 ${follower.name} a commencé à vous suivre`,
          subtitle: 'Abonné à votre profil citoyen',
          time: 'Récemment',
          isRead: true,
          avatar: follower.avatar,
          action: () => {
            setSelectedPublicUserId(follower.id);
            onClose();
          }
        });
      }
    });

    // 3. Recent causes (Petitions & Cagnottes & Tontines)
    petitions.slice(0, 3).forEach(p => {
      notificationItems.push({
        id: `pet-${p.id}`,
        type: 'cause',
        title: `✍️ Pétition : ${p.title.slice(0, 45)}...`,
        subtitle: `Organisé par ${p.organizer?.name || 'Citoyen'}`,
        time: 'Pétition active',
        isRead: true,
        action: () => {
          if (onNavigate) {
            onNavigate('petitions', { id: p.id });
          }
          onClose();
        }
      });
    });

    cagnottes.slice(0, 3).forEach(c => {
      notificationItems.push({
        id: `cag-${c.id}`,
        type: 'cause',
        title: `🪙 Cagnotte : ${c.title.slice(0, 45)}...`,
        subtitle: `Objectif : ${c.amountTarget.toLocaleString()} FCFA`,
        time: 'Campagne active',
        isRead: true,
        action: () => {
          if (onNavigate) {
            onNavigate('cagnottes', { id: c.id });
          }
          onClose();
        }
      });
    });
  }

  const unreadCount = notificationItems.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    if (currentUser) {
      const unreadSenders = Array.from(new Set(directMessages.filter(m => m.receiverId === currentUser.id && !m.read).map(m => m.senderId)));
      unreadSenders.forEach(sId => markMessagesAsRead(sId));
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: isMobileView ? 'flex-end' : 'flex-start',
        justifyContent: isMobileView ? 'center' : 'flex-end',
        padding: isMobileView ? 0 : '4.5rem 2rem 1rem 1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="glass animate-fade-in animate-slide-up"
        style={{
          maxWidth: '420px',
          width: '100%',
          maxHeight: isMobileView ? '80vh' : '85vh',
          background: 'var(--light-card)',
          borderRadius: isMobileView ? '24px 24px 0 0' : 'var(--radius-lg)',
          border: '1.5px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(0, 133, 63, 0.08) 0%, rgba(252, 209, 22, 0.08) 100%)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            <strong style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>({unreadCount})</span>}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {unreadCount > 0 && (
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 'bold' }}
                onClick={handleMarkAllRead}
              >
                Tout lire ✓
              </button>
            )}
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }}
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{ padding: '0.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notificationItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary-light)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🇸🇳</span>
              <p style={{ fontWeight: 'bold', margin: 0 }}>Aucune notification pour l'instant</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Restez connecté pour recevoir les actualités de vos mobilisations !</p>
            </div>
          ) : (
            notificationItems.map((item) => (
              <div 
                key={item.id}
                onClick={item.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: item.isRead ? 'white' : 'rgba(0, 133, 63, 0.05)',
                  border: item.isRead ? '1px solid var(--border-light)' : '1.5px solid var(--primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {!item.isRead && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary)'
                    }}
                  />
                )}

                {item.avatar ? (
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundImage: `url("${item.avatar}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1.5px solid var(--primary)',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(0, 133, 63, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0
                    }}
                  >
                    {item.type === 'message' ? '💬' : item.type === 'follower' ? '👥' : '📢'}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: item.isRead ? 600 : 800, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary-light)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
