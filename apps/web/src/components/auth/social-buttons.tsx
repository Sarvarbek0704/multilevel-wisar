'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { GoogleIcon, TelegramIcon } from '@/components/icons';
import { authRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AuthResult } from '@/lib/types';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? '';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function SocialButtons({
  onSuccess,
  onError,
}: {
  onSuccess: (result: AuthResult) => void;
  onError: (message: string) => void;
}) {
  const { signIn } = useAuth();
  const telegramSlot = useRef<HTMLDivElement>(null);
  const googleSlot = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);
  // Vidjet faqat @BotFather'da /setdomain qilingan domenda ishlaydi.
  // localhost'da u "Bot domain invalid" chiqaradi — shuning uchun tugmaga tushamiz.
  const [widgetUsable, setWidgetUsable] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    setWidgetUsable(host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local'));
  }, []);

  // Telegram Login Widget — rasmiy skript, callback global funksiyaga keladi
  useEffect(() => {
    if (!BOT_USERNAME || !widgetUsable || !telegramSlot.current) return;

    window.onTelegramAuth = async (user) => {
      try {
        const result = await authRequest('/auth/telegram', user);
        signIn(result);
        onSuccess(result);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Telegram orqali kirish muvaffaqiyatsiz');
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '0');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    telegramSlot.current.replaceChildren(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [signIn, onSuccess, onError, widgetUsable]);

  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID || !googleSlot.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          const result = await authRequest('/auth/google', { idToken: credential });
          signIn(result);
          onSuccess(result);
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Google orqali kirish muvaffaqiyatsiz');
        }
      },
    });
    window.google.accounts.id.renderButton(googleSlot.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: 350,
      text: 'continue_with',
      locale: 'uz',
    });
  }, [googleReady, signIn, onSuccess, onError]);

  return (
    <div className="flex flex-col gap-2.5">
      {BOT_USERNAME && widgetUsable ? (
        <div ref={telegramSlot} className="flex justify-center [&>iframe]:!w-full" />
      ) : (
        <a
          href={`https://t.me/${BOT_USERNAME || 'sf_multilevel_bot'}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2.5 bg-telegram py-3.5 font-display text-md font-semibold text-white"
        >
          <TelegramIcon size={18} />
          Telegram bot orqali boshlash
        </a>
      )}

      {GOOGLE_CLIENT_ID ? (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            onLoad={() => setGoogleReady(true)}
          />
          <div ref={googleSlot} className="flex justify-center" />
        </>
      ) : (
        <button
          disabled
          title="Google OAuth hali sozlanmagan"
          className="flex items-center justify-center gap-2.5 border border-line-4 py-3.5 font-display text-md font-semibold text-ink-5"
        >
          <GoogleIcon size={18} />
          Google bilan davom etish
        </button>
      )}
    </div>
  );
}
