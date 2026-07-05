const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_STORAGE_KEY = "cf_google_token";
const CLIENT_ID_STORAGE_KEY = "cf_google_client_id";

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

interface GoogleTokenClient {
  callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => void;
  requestAccessToken: (opts: { prompt: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: GoogleTokenClient["callback"];
          }) => GoogleTokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

let tokenClient: GoogleTokenClient | null = null;

function waitForGis(): Promise<void> {
  return new Promise((resolve) => {
    (function check() {
      if (window.google?.accounts?.oauth2) resolve();
      else setTimeout(check, 50);
    })();
  });
}

export function getClientId(): string | null {
  return localStorage.getItem(CLIENT_ID_STORAGE_KEY);
}

export function setClientId(id: string): void {
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, id.trim());
  tokenClient = null; // force re-init with the new client id
}

function loadStoredToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as StoredToken;
    if (t.expiresAt > Date.now() + 30_000) return t;
  } catch {
    // ignore malformed cache
  }
  return null;
}

function storeToken(t: StoredToken): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(t));
}

function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function ensureTokenClient(): Promise<GoogleTokenClient> {
  await waitForGis();
  const clientId = getClientId();
  if (!clientId) throw new Error("No Google OAuth Client ID configured yet");
  if (!tokenClient) {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: () => {},
    });
  }
  return tokenClient;
}

export async function requestNewToken(): Promise<string> {
  const client = await ensureTokenClient();
  return new Promise((resolve, reject) => {
    client.callback = (resp) => {
      if (resp.error || !resp.access_token) {
        reject(new Error(resp.error || "Sign-in failed"));
        return;
      }
      const expiresAt = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
      storeToken({ accessToken: resp.access_token, expiresAt });
      resolve(resp.access_token);
    };
    client.requestAccessToken({ prompt: "" });
  });
}

/** Returns a valid access token, prompting the sign-in popup only if needed. */
export async function getAccessToken(): Promise<string> {
  const stored = loadStoredToken();
  if (stored) return stored.accessToken;
  return requestNewToken();
}

export function isSignedIn(): boolean {
  return loadStoredToken() !== null;
}

export function signOut(): void {
  const stored = loadStoredToken();
  clearStoredToken();
  if (stored) window.google?.accounts?.oauth2.revoke(stored.accessToken, () => {});
}
