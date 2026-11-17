import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "./AdminLogin.css";

export default function AdminLogin({ loginForm, setLoginForm, showPassword, setShowPassword, loginLoading, loginError, handleLogin }) {
  return (
    <main className="admin-login-page">
      <div className="admin-login-decoration admin-login-decoration-one">✿</div>
      <div className="admin-login-decoration admin-login-decoration-two">♡</div>
      <form className="admin-login-card" onSubmit={handleLogin}>
        <div className="admin-login-logo"><img src="/images/logo.png" alt="LittleWonders Logo" /></div>
        <h1>Welcome</h1>
        {loginError && <div className="admin-alert admin-alert-error" role="alert">{loginError}</div>}
        <label htmlFor="admin-username">Username</label>
        <input id="admin-username" type="text" autoComplete="username" placeholder="Enter admin username" value={loginForm.username} onChange={(event) => setLoginForm((previous) => ({ ...previous, username: event.target.value }))} required />
        <label htmlFor="admin-password">Password</label>
        <div className="admin-password-field">
          <input id="admin-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={loginForm.password} onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))} required />
          <button type="button" className="admin-password-toggle" onClick={() => setShowPassword((previous) => !previous)} aria-label={showPassword ? "Hide password" : "Show password"}>
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        <button type="submit" className="admin-login-button" disabled={loginLoading}>{loginLoading ? "Signing in..." : "Sign in"}</button>
      </form>
    </main>
  );
}
