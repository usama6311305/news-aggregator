import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiUserPlus
} from "react-icons/fi";
import "./styles/Auth.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setErrorMsg(data.message || "Failed to create account. Try another email.");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setErrorMsg("Failed to connect to authentication server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-ambient-glow"></div>

      <div className="auth-card">
        <Link to="/" className="auth-back-link">
          <FiArrowLeft /> Back to Headlines
        </Link>

        <div className="auth-header">
          <div className="auth-brand-icon">
            <FiTrendingUp />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join NewsPulse for free to unlock tailored feeds
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert-box error" style={{ marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="auth-alert-box success" style={{ marginBottom: 16 }}>
            {successMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">Full Name or Username</label>
            <div className="auth-input-wrapper">
              <FiUser className="auth-input-icon" />
              <input
                type="text"
                name="username"
                className="auth-input"
                placeholder="e.g. Alex Morgan"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                type="email"
                name="email"
                className="auth-input"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="auth-input"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password view"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            <FiUserPlus />
            <span>{loading ? "Creating Account..." : "Create Free Account"}</span>
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
