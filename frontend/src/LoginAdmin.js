import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "./api/api";
import "./AdminLogin.css";
import mLogo from './images/m-logo.png';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await adminLogin(form);
      const data = response.data || {};

      if (!data.success) {
        setErrorMsg(data.message || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("adminToken", data.token);
      navigate("/admin/dashboard");
    } catch (error) {
      const serverMsg = error.response?.data?.message;
      if (serverMsg) setErrorMsg(serverMsg);
      else setErrorMsg("Invalid credentials or network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="photo-login-wrapper">
      <div className="photo-login-card">
        <div className="brand">
          <img src={mLogo} alt="Logo" className="navbar-logo-img" />
          <h1>Madhuri Photo Studio</h1>
          <p>Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            name="username"
            placeholder="Admin Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Developing Photos..." : "Enter Studio"}
          </button>

          {errorMsg && <p className="form-error">{errorMsg}</p>}
        </form>
      </div>
    </div>
  );
}
