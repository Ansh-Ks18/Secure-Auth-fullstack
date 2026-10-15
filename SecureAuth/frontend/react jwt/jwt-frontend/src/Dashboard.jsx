
import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        setError("Your session has expired. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:8085/api/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

console.log("Profile API response:", response.data);
setProfile(response.data);

} catch (err) {
        setError(
          err.response?.status === 401
            ? "Your session has expired. Please log in again."
            : "Unable to load your profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return <main className="dashboard"><p>Loading your profile...</p></main>;
  }

  if (error) {
    return (
      <main className="dashboard">
        <h2>Session unavailable</h2>
        <p>{error}</p>
        <button onClick={onLogout}>Return to login</button>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your account overview</p>
        </div>

        <button onClick={onLogout}>Logout</button>
      </header>

      <section className="profile-card">
        <div className="avatar">
          {(profile.name || profile.email || "U")
            .charAt(0)
            .toUpperCase()}
        </div>

        <h2>Welcome, {profile.name || "User"}!</h2>
        <p>You are viewing a protected page.</p>

        <div className="profile-detail">
          <span>Full name</span>
          <strong>{profile.name || "Not provided"}</strong>
        </div>

        <div className="profile-detail">
          <span>Email address</span>
          <strong>{profile.email || "Not provided"}</strong>
        </div>

        <div className="status">
          Authenticated
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
