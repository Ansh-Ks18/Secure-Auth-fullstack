
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { setAccessToken } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(form);

      // Store only the access token in JavaScript memory.
      // The refresh token is stored in an HttpOnly cookie by Spring Boot.
      setAccessToken(data.accessToken);

      // Navigate to the dashboard after successful login.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/register" className="brand">
          <span className="brand-icon">S</span>
          SecureAuth
        </Link>

        <Link className="topbar-link" to="/register">
          Create account →
        </Link>
      </header>

      <main className="auth-layout">
        <section className="hero">
          <span className="eyebrow">✦ Welcome back</span>

          <h1>
            Good to see
            <br />
            <span className="gradient-text">you again.</span>
          </h1>

          <p>
            Sign in to access your personal dashboard.
            Your account is waiting for you.
          </p>

          <div className="feature-list">
            <div className="feature">
              <span className="feature-icon">✓</span>
              Secure sign-in with your credentials
            </div>

            <div className="feature">
              <span className="feature-icon">⌘</span>
              JWT-protected API access
            </div>

            <div className="feature">
              <span className="feature-icon">↗</span>
              Access your personal profile
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="card-heading">
            <h2>Welcome back</h2>
            <p>Enter your credentials to sign in.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p className="form-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </main>

      <footer className="page-footer">
        © 2026 SecureAuth · Built with React and Spring Boot
      </footer>
    </div>
  );
}
