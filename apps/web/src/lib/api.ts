import type { AuthResult, TokenPair } from './types';

const ACCESS_KEY = 'ml.access';
const REFRESH_KEY = 'ml.refresh';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStore = {
  get access() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  save(tokens: TokenPair) {
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

/** Bir vaqtda bitta yangilash — parallel 401'lar bitta refreshni kutadi. */
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;

  refreshPromise ??= (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        tokenStore.clear();
        return false;
      }
      tokenStore.save((await response.json()) as TokenPair);
      return true;
    } catch {
      return false;
    } finally {
      // Keyingi 401 yangi urinish boshlashi uchun
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Token bo'lmasa ham so'rov yuboriladi (public endpointlar) */
  auth?: boolean;
  raw?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, raw, headers, ...rest } = options;

  const send = async (): Promise<Response> => {
    const finalHeaders = new Headers(headers);
    if (body !== undefined && !(body instanceof FormData)) {
      finalHeaders.set('Content-Type', 'application/json');
    }
    const access = tokenStore.access;
    if (auth && access) finalHeaders.set('Authorization', `Bearer ${access}`);

    return fetch(`/api${path}`, {
      ...rest,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  };

  let response = await send();

  if (response.status === 401 && auth && tokenStore.refresh) {
    if (await refreshTokens()) {
      response = await send();
    }
  }

  if (!response.ok) {
    let payload: unknown;
    let message = `So‘rov bajarilmadi (${response.status})`;
    try {
      payload = await response.json();
      const maybe = payload as { message?: string | string[] };
      if (Array.isArray(maybe.message)) message = maybe.message.join('; ');
      else if (maybe.message) message = maybe.message;
    } catch {
      /* javob JSON emas */
    }
    throw new ApiError(response.status, message, payload);
  }

  if (raw || response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Tokenlarni saqlaydigan auth so'rovlari uchun qulaylik. */
export async function authRequest(path: string, body: unknown): Promise<AuthResult> {
  const result = await api<AuthResult>(path, { method: 'POST', body, auth: false });
  tokenStore.save(result.tokens);
  return result;
}
