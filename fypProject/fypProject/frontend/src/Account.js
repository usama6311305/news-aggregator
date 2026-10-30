import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";
import {
  FiUser,
  FiMail,
  FiLock,
  FiCamera,
  FiBookmark,
  FiActivity,
  FiArrowLeft,
  FiLogOut,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import "./styles/Auth.css";

const Account = () => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [newPassword, setNewPassword] = useState("");
  const [profilePic, setProfilePic] = useState(user?.profilePic || null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const { savedArticles } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setProfilePic(parsed.profilePic || null);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id || user._id, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: "Password updated successfully!", type: "success" });
        setNewPassword("");
      } else {
        setMessage({ text: data.message || "Failed to update password", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Server error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicUpload = async () => {
    if (!imageFile) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    const formData = new FormData();
    formData.append("profilePic", imageFile);
    formData.append("userId", user.id || user._id);

    try {
      const response = await fetch("http://localhost:5000/api/auth/upload-profile-pic", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, profilePic: data.imageUrl };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfilePic(data.imageUrl);
        setImageFile(null);
        setMessage({ text: "Profile photo saved successfully!", type: "success" });
      } else {
        setMessage({ text: data.message || "Failed to upload image", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Error uploading profile picture", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userInterests");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <FiUser style={{ fontSize: "3rem", color: "var(--accent-primary)", marginBottom: 12 }} />
          <h2 style={{ marginBottom: 12 }}>Please Sign In</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            You need to be logged in to view your profile settings and reading preferences.
          </p>
          <Link to="/login" className="btn-nav-gradient" style={{ display: "inline-block" }}>
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  const avatarSrc = profilePic
    ? profilePic.startsWith("http")
      ? profilePic
      : `http://localhost:5000${profilePic}`
    : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";

  return (
    <div style={{ minHeight: "calc(100vh - 72px)", background: "var(--bg-primary)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        {/* Back Link */}
        <Link to="/" className="auth-back-link" style={{ marginBottom: 24 }}>
          <FiArrowLeft /> Back to Headlines
        </Link>

        {/* Profile Card */}
        <div
          className="glass-panel"
          style={{
            borderRadius: "var(--radius-lg)",
            padding: "36px",
            marginBottom: 28
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            {/* Left: Avatar & Names */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <img
                  src={avatarSrc}
                  alt={user.username}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--accent-primary)",
                    boxShadow: "0 0 20px var(--accent-glow)"
                  }}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";
                  }}
                />
                <label
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    background: "var(--accent-primary)",
                    color: "#fff",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                  }}
                  title="Change avatar photo"
                >
                  <FiCamera />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setProfilePic(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>
                  {user.username}
                </h1>
                <p style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <FiMail /> {user.email}
                </p>
                {imageFile && (
                  <button
                    onClick={handleProfilePicUpload}
                    className="btn-nav-gradient"
                    style={{ marginTop: 12, padding: "6px 16px", fontSize: "0.85rem" }}
                  >
                    Save New Profile Photo
                  </button>
                )}
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="card-preview-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#EF4444",
                borderColor: "rgba(239, 68, 68, 0.3)"
              }}
            >
              <FiLogOut /> Logout
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px solid var(--border-light)"
            }}
          >
            <div style={{ background: "var(--bg-tertiary)", padding: 18, borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent-primary)", marginBottom: 6 }}>
                <FiBookmark style={{ fontSize: "1.2rem" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>SAVED STORIES</span>
              </div>
              <p style={{ fontSize: "1.6rem", fontWeight: 800 }}>{savedArticles.length}</p>
            </div>

            <div style={{ background: "var(--bg-tertiary)", padding: 18, borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#10B981", marginBottom: 6 }}>
                <FiActivity style={{ fontSize: "1.2rem" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>ACCOUNT STATUS</span>
              </div>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#10B981" }}>Active Member</p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div
          className="glass-panel"
          style={{
            borderRadius: "var(--radius-lg)",
            padding: "32px"
          }}
        >
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <FiLock style={{ color: "var(--accent-primary)" }} /> Security & Password
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 20 }}>
            Update your account password to keep your profile secure.
          </p>

          {message.text && (
            <div
              className={`auth-alert-box ${message.type}`}
              style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}
            >
              {message.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ maxWidth: 440 }}>
            <div className="auth-input-group" style={{ marginBottom: 16 }}>
              <label className="auth-label">New Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-nav-gradient"
              style={{ padding: "10px 24px" }}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Account;
