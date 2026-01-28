import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import mLogo from "./images/m-logo.png";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

    axios
      .get(`${API_BASE}/api/bookings`)
      .then((res) => setBookings(res.data.bookings || []))
      .catch((err) => console.log(err));

    axios
      .get(`${API_BASE}/api/admin/messages`)
      .then((res) => setMessages(res.data.messages || []))
      .catch((err) => console.log('Failed to fetch messages', err));
  }, []);

  const pending = bookings.filter((b) => b.status === "pending");
  const completed = bookings.filter((b) => b.status === "completed");
  const unreadMessages = messages.filter(m => !m.is_read);
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);
  const markRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/admin/messages/${id}/read`);
      fetchMessages(); // 🔥 refresh from DB
    } catch (err) {
      console.error("Failed to mark message read", err);
    }
  };

  return (
    <div className="studio-dashboard">
      {/* ===== Sidebar Menu ===== */}
      <aside className="sidebar">
        <h2>📸 Admin</h2>
        <ul>
          <li className="active">Dashboard</li>
          <li>Bookings</li>
          <li>Payments</li>
          <li>Clients</li>
          <li className="logout">Logout</li>
        </ul>
      </aside>

      {/* ===== Main Content ===== */}
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-left">
            <img src={mLogo} alt="Logo" className="header-logo-img" />
            <h1>Madhuri Photo Studio</h1>
          </div>
          <p>Admin Dashboard</p>
        </header>

        <section className="stats">
          <div className="stat-card">
            <h3>Total Orders</h3>
            <span>{bookings.length}</span>
          </div>
          <div className="stat-card pending">
            <h3>Pending Shoots</h3>
            <span>{pending.length}</span>
          </div>
          <div className="stat-card completed">
            <h3>Completed Shoots</h3>
            <span>{completed.length}</span>
          </div>
          <div className="stat-card messages">
            <h3>Messages</h3>
            <span>{unreadMessages.length}</span>
          </div>
        </section>

        <section className="orders">
          <h2>📋 Booking History</h2>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Event</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((b, i) => (
                  <tr key={i}>
                    <td>{b.full_name}</td>
                    <td>{b.event_type}</td>
                    <td>{b.location || "—"}</td>
                    <td>{b.booking_date}</td>
                    <td>{b.booking_time || "—"}</td>
                    <td>
                      <span className={`status ${b.status || "pending"}`}>
                        {b.status || "pending"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`payment ${b.payment_status || "pending"}`}
                      >
                        {b.payment_status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 36 }}>📬 Messages</h2>
          <div className="messages-list">
            {messages.length === 0 ? (
              <p>No messages yet.</p>
            ) : (
              messages.slice(0, 8).map((m) => (
                <div key={m.id} className="message-item" style={{ padding: 12, borderRadius: 8, background: '#fff', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{m.name} <small style={{ color: '#666' }}>{m.email}</small></strong>
                    {!m.is_read && <button onClick={() => markRead(m.id)} style={{ background: '#FF9C11', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Mark read</button>}
                  </div>
                  <div style={{ marginTop: 8, color: '#222' }}>{m.message}</div>
                  <small style={{ color: '#888' }}>{new Date(m.created_at).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
