import { useState } from "react";
import { getClientId, setClientId, isSignedIn, requestNewToken, signOut } from "../lib/sheets/auth";

interface Props {
  children: React.ReactNode;
}

export function SetupGate({ children }: Props) {
  const [clientId, setClientIdState] = useState(getClientId());
  const [signedIn, setSignedIn] = useState(isSignedIn());
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (signedIn && clientId) {
    return (
      <>
        <div className="signed-in-bar">
          <span>Connected to Google Sheets</span>
          <button
            className="link-button"
            onClick={() => {
              signOut();
              setSignedIn(false);
            }}
          >
            sign out
          </button>
        </div>
        {children}
      </>
    );
  }

  if (!clientId) {
    return (
      <div className="setup-gate">
        <div className="setup-gate__card">
          <h1>Connect your Google account</h1>
          <p>
            This app stores its data directly in a Google Sheet in your Drive. It needs an OAuth Client
            ID from your own Google Cloud project (one-time setup, free). See the README for exact
            steps to create one, then paste it here.
          </p>
          <label className="setup-gate__field">
            Google OAuth Client ID
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
            />
          </label>
          <button
            className="secondary-button"
            disabled={!draft.trim()}
            onClick={() => {
              setClientId(draft.trim());
              setClientIdState(draft.trim());
            }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-gate">
      <div className="setup-gate__card">
        <h1>Sign in with Google</h1>
        <p>Grant access to Google Sheets so this app can create and edit your project spreadsheet.</p>
        {error && <p className="setup-gate__error">{error}</p>}
        <button
          className="secondary-button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              await requestNewToken();
              setSignedIn(true);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sign-in failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>
        <button
          className="link-button"
          onClick={() => {
            setClientId("");
            setClientIdState(null);
          }}
        >
          use a different Client ID
        </button>
      </div>
    </div>
  );
}
