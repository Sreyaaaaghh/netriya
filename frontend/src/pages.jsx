import { useState } from "react";

export function Login({ goHome, onSuccess, error = "", busy = false }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onSuccess({ username: username.trim(), password });
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <button className="auth-logo" onClick={goHome} type="button">NETRAVA</button>
          <div className="auth-copy">
            <p className="auth-eyebrow">RETINAL SCREENING</p>
            <h1>Welcome back.</h1>
            <p>Sign in to continue to your retinal screening dashboard.</p>
          </div>
          <div className="auth-side-note"><span>01</span> AI-assisted retinal screening</div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">
            <div className="mobile-auth-header">
              <button className="auth-logo" onClick={goHome} type="button">NETRAVA</button>
            </div>

            <p className="auth-form-eyebrow">ACCOUNT</p>
            <h2>Log in</h2>
            <p className="auth-form-intro">Use your username and password to continue.</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={submit}>
              <div className="auth-field">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  disabled={busy}
                  autoComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  disabled={busy}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit" disabled={busy || !username.trim() || !password}>
                {busy ? "Signing in..." : "Log in"}
                <span>{busy ? "…" : "→"}</span>
              </button>
            </form>

            <div className="auth-switch">
              <span>Don't have an account?</span>
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("netrava-open-signup"))} disabled={busy}>
                Create patient account
              </button>
            </div>

            <button className="auth-back" onClick={goHome} type="button" disabled={busy}>← Back to NETRAVA</button>
          </div>
        </div>
      </div>
    </main>
  );
}

export function Signup({ goHome, onSuccess, error = "", busy = false }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  function submit(e) {
    e.preventDefault();
    setLocalError("");
    if (!name.trim() || !username.trim() || !password || !confirmPassword) {
      setLocalError("Please complete all fields.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    onSuccess({ fullName: name.trim(), username: username.trim(), password });
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-left signup-left">
          <button className="auth-logo" onClick={goHome} type="button">NETRAVA</button>
          <div className="auth-copy">
            <p className="auth-eyebrow">RETINAL SCREENING</p>
            <h1>Start with NETRAVA.</h1>
            <p>Create a patient account to access your screening workflow and history.</p>
          </div>
          <div className="auth-side-note"><span>02</span> Screening support, not diagnosis</div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">
            <div className="mobile-auth-header">
              <button className="auth-logo" onClick={goHome} type="button">NETRAVA</button>
            </div>

            <p className="auth-form-eyebrow">NEW ACCOUNT</p>
            <h2>Create patient account</h2>
            <p className="auth-form-intro">Your account will be created with the patient role.</p>

            {(localError || error) && <div className="auth-error">{localError || error}</div>}

            <form onSubmit={submit}>
              <div className="auth-field">
                <label>Full name</label>
                <input type="text" placeholder="Enter your full name" value={name} disabled={busy} autoComplete="name" onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="auth-field">
                <label>Username</label>
                <input type="text" placeholder="Choose a username" value={username} disabled={busy} autoComplete="username" onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input type="password" placeholder="At least 8 characters" value={password} disabled={busy} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div className="auth-field">
                <label>Confirm password</label>
                <input type="password" placeholder="Re-enter password" value={confirmPassword} disabled={busy} autoComplete="new-password" onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              <button type="submit" className="auth-submit" disabled={busy}>
                {busy ? "Creating account..." : "Create account"}
                <span>{busy ? "…" : "→"}</span>
              </button>
            </form>

            <div className="auth-switch">
              <span>Already have an account?</span>
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("netrava-open-login"))} disabled={busy}>Log in</button>
            </div>

            <button className="auth-back" onClick={goHome} type="button" disabled={busy}>← Back to NETRAVA</button>
          </div>
        </div>
      </div>
    </main>
  );
}
