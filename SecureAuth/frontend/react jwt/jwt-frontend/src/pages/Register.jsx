
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
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
      await registerUser(form);

      // Registration succeeded; move to the login page.
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">S</span>
          SecureAuth
        </div>

        <Link className="topbar-link" to="/login">
          Sign in →
        </Link>
      </header>

      <main className="auth-layout">
        <section className="hero">
          <span className="eyebrow">✦ Secure access, simplified</span>

          <h1>
            Your digital world,
            <br />
            <span className="gradient-text">protected.</span>
          </h1>

          <p>
            Create your account and experience a simple,
            secure way to access your personal dashboard.
          </p>

          <div className="feature-list">
            <div className="feature">
              <span className="feature-icon">✓</span>
              Secure password authentication
            </div>

            <div className="feature">
              <span className="feature-icon">⌘</span>
              Token-based access with JWT
            </div>

            <div className="feature">
              <span className="feature-icon">↗</span>
              Your personal dashboard
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="card-heading">
            <h2>Create account</h2>
            <p>Enter your details to get started.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

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
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <p className="form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </main>

      <footer className="page-footer">
        © 2026 SecureAuth · Built with React and Spring Boot
      </footer>
    </div>
  );
}
