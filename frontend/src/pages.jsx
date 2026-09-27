import { useState } from "react";
import fundImage from "./assets/fund.jpg";

const RETINA_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23190d07'/><circle cx='200' cy='200' r='140' fill='%23c65320'/><circle cx='200' cy='200' r='110' fill='%23e36b32'/><circle cx='260' cy='190' r='24' fill='%23ffbf80'/><path d='M260 190 Q180 120 120 150 M260 190 Q170 230 110 210 M260 190 Q210 290 170 310' stroke='%23701a0a' stroke-width='8' fill='none'/></svg>";

function FundusRetina() {
  return (
    <div className="fundus-card-frame">
      <img
        src={fundImage}
        alt="Retinal Fundus"
        className="fundus-full-img"
      />
      <div className="fundus-scan-laser" />
    </div>
  );
}

export function Login({
  goHome,
  onSuccess,
  error = "",
  busy = false,
  targetRole = "patient",
  onChangeRole,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isDoctor = targetRole === "admin";

  function submit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onSuccess({ username: username.trim(), password });
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-left auth-left-orange">
          <button
            className="auth-prominent-back"
            onClick={goHome}
            type="button"
          >
            <span className="auth-back-arrow">←</span>
            <span>Back</span>
          </button>

          <div className="auth-center-block">
            <FundusRetina />
            <h1 className="auth-role-title">
              {isDoctor ? "Doctor / Admin" : "Patient"}
            </h1>
          </div>

          <div />
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">
            <div className="auth-header-row">
              <h2>Log in</h2>
              {onChangeRole && (
                <button
                  type="button"
                  className="auth-switch-role-btn"
                  onClick={onChangeRole}
                >
                  Change role
                </button>
              )}
            </div>

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

              <button
                type="submit"
                className="auth-submit"
                disabled={busy || !username.trim() || !password}
              >
                {busy ? "Signing in..." : "Log in"}
                <span>{busy ? "…" : "→"}</span>
              </button>
            </form>

            {!isDoctor && (
              <div className="auth-switch">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("netrava-open-signup"))
                  }
                  disabled={busy}
                >
                  Create patient account
                </button>
              </div>
            )}
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

  const hasCapital = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\/`~]/.test(password);
  const hasLength = password.length >= 8;

  function submit(e) {
    e.preventDefault();
    setLocalError("");

    if (!name.trim() || !username.trim() || !password || !confirmPassword) {
      setLocalError("Please complete all fields.");
      return;
    }
    if (!hasLength) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }
    if (!hasCapital) {
      setLocalError("Password must include at least one capital letter (A-Z).");
      return;
    }
    if (!hasNumber) {
      setLocalError("Password must include at least one number (0-9).");
      return;
    }
    if (!hasSymbol) {
      setLocalError("Password must include at least one symbol (!@#$%).");
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
        <div className="auth-left auth-left-orange">
          <button
            className="auth-prominent-back"
            onClick={goHome}
            type="button"
          >
            <span className="auth-back-arrow">←</span>
            <span>Back</span>
          </button>

          <div className="auth-center-block">
            <FundusRetina />
            <h1 className="auth-role-title">Patient Sign up</h1>
          </div>

          <div />
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">
            <h2>Create patient account</h2>

            {(localError || error) && (
              <div className="auth-error">{localError || error}</div>
            )}

            <form onSubmit={submit}>
              <div className="auth-field">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  disabled={busy}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Choose a username"
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
                  placeholder="Min. 8 characters"
                  value={password}
                  disabled={busy}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="pw-criteria-list">
                  <span className={`pw-pill ${hasLength ? "valid" : ""}`}>
                    {hasLength ? "✓" : "○"} 8+ chars
                  </span>
                  <span className={`pw-pill ${hasCapital ? "valid" : ""}`}>
                    {hasCapital ? "✓" : "○"} 1 Capital
                  </span>
                  <span className={`pw-pill ${hasNumber ? "valid" : ""}`}>
                    {hasNumber ? "✓" : "○"} 1 Number
                  </span>
                  <span className={`pw-pill ${hasSymbol ? "valid" : ""}`}>
                    {hasSymbol ? "✓" : "○"} 1 Symbol
                  </span>
                </div>
              </div>

              <div className="auth-field">
                <label>Confirm password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  disabled={busy}
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit" disabled={busy}>
                {busy ? "Creating account..." : "Create account"}
                <span>{busy ? "…" : "→"}</span>
              </button>
            </form>

            <div className="auth-switch">
              <span>Already have an account?</span>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("netrava-open-login"))
                }
                disabled={busy}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}