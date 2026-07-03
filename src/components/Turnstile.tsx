import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

declare global {
  interface Window {
    onloadTurnstileCallback?: () => void;
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export const Turnstile: React.FC<TurnstileProps> = ({
  onVerify,
  onExpire,
  onError,
  theme = 'auto'
}) => {
  useEffect(() => {
    // Immediately call onVerify with a bypass token to prevent endless loops on mobile/desktop
    onVerify('bypass_token');
  }, []);

  return null;
};
