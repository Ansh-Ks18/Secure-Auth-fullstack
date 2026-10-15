
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProfile,
  refreshAccessToken,
  logoutUser,
} from "../services/api";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "../services/auth";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        let token = getAccessToken();

        // After a page reload, the access token is no longer in memory.
        // Request a new one using the HttpOnly refresh-token cookie.
        if (!token) {
          const refreshedData = await refreshAccessToken();

          token = refreshedData.accessToken;
          setAccessToken(token);
        }

        try {
          const profile = await getProfile(token);

          if (active) {
            setUser(profile);
            setError("");
          }
        } catch (profileError) {
          // If the access token expired, try refreshing it once.
          if (!isUnauthorized(profileError)) {
            throw profileError;
          }

          const refreshedData = await refreshAccessToken();
          token = refreshedData.accessToken;
          setAccessToken(token);

          const profile = await getProfile(token);

          if (active) {
            setUser(profile);
            setError("");
          }
        }
      } catch (err) {
        clearAccessToken();

        if (active) {
          setError(err.message || "Unable to load your profile.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout request failed:", err.message);
    } finally {
      clearAccessToken();
      navigate("/login", { replace: true });
    }
  }

  function handleReturnToLogin() {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p className="center-message">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="app-shell">
        <section className="center-message">
          <h2>Unable to load profile</h2>
          <p>{error || "Your profile could not be loaded."}</p>
          <p>Your session may have expired. Please sign in again.</p>

          <button
            className="primary-btn"
            onClick={handleReturnToLogin}
          >
            Return to login
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">S</span>
          SecureAuth
        </div>

        <button className="secondary-btn" onClick={handleLogout}>
          Sign out ↗
        </button>
      </header>

      <main className="dashboard-layout">
        <section className="dashboard-heading">
          <span className="eyebrow">✦ Your workspace</span>

          <h1>Welcome back, {user.name}!</h1>

          <p>
            You're signed in. Here are your account details.
          </p>
        </section>

        <section className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>

              <span className="status-pill">
                <span className="status-dot" />
                Profile loaded
              </span>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <span>User ID</span>
              <strong>{user.id}</strong>
            </div>

            <div className="detail-item">
              <span>Account name</span>
              <strong>{user.name}</strong>
            </div>

            <div className="detail-item">
              <span>Email address</span>
              <strong>{user.email}</strong>
            </div>

            <div className="detail-item">
              <span>Authentication</span>
              <strong>JWT Bearer Token</strong>
            </div>
          </div>

          <div className="dashboard-actions">
            <button
              className="secondary-btn"
              onClick={() => window.location.reload()}
            >
              Refresh profile
            </button>

            <button className="primary-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </section>
      </main>

      <footer className="page-footer">
        Your profile is fetched from your protected Spring Boot API.
      </footer>
    </div>
  );
}

function isUnauthorized(error) {
  return error.status === 401 || error.status === 403;
}
