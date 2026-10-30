import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiLogIn
} from "react-icons/fi";
import "./styles/Auth.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Login successful! Redirecting to feed...");
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Fetch user interests
        try {
          const interestsRes = await fetch(
            `http://localhost:5000/api/interactions/user/${data.user.id}/interests`
          );
          const interestsData = await interestsRes.json();
          if (interestsRes.ok && interestsData.interests) {
            localStorage.setItem("userInterests", JSON.stringify(interestsData.interests));
          }
        } catch (intErr) {
          console.log("Interests fetch note:", intErr);
        }

        setTimeout(() => {
          navigate("/");
        }, 800);
      } else {
        setErrorMsg(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to continue exploring personalized news
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
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
            <FiLogIn />
            <span>{loading ? "Authenticating..." : "Sign In to NewsPulse"}</span>
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account yet?
          <Link to="/signup">Create an Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
