import React, { useState, useEffect } from "react";
import "./Booked.css";

export default function Booked() {
  const [activeTab, setActiveTab] = useState("current");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
        const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
        let url = `${API_BASE}/api/bookings`;
        if (user?.id) url += `?userId=${user.id}`;
        else if (user?.email) url += `?email=${encodeURIComponent(user.email)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load bookings');
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      }
    };
    fetchBookings();
  }, []);

  const currentBookings = bookings.filter(b => b.status !== "Completed");
  const historyBookings = bookings.filter(b => b.status === "Completed");

  return (
    <div className="booked-wrapper">
      <div className="bubbles">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="bubble" style={{ left: `${(i * 7) % 100}%`, animationDelay: `${(i % 6) * 0.6}s`, width: `${20 + (i % 3) * 18}px`, height: `${20 + (i % 3) * 18}px` }}></span>
        ))}
      </div>

      <h2>📌 My Booked Events</h2>

      {/* Tabs */}
      <div className="booked-tabs">
        <button onClick={() => setActiveTab("current")} className={activeTab === "current" ? "active" : ""}>
          Current
        </button>
        <button onClick={() => setActiveTab("history")} className={activeTab === "history" ? "active" : ""}>
          History
        </button>
        <button onClick={() => setActiveTab("notifications")} className={activeTab === "notifications" ? "active" : ""}>
          Notifications
        </button>
        <button onClick={() => setActiveTab("offers")} className={activeTab === "offers" ? "active" : ""}>
          Offers
        </button>
      </div>

      {/* Content */}
      <div className="booked-content">
        {activeTab === "current" && (
          <>
            {currentBookings.length === 0 ? (
              <p>No current bookings.</p>
            ) : (
              currentBookings.map(b => (
                <div className="booked-card" key={b.id}>
                  <h4>{b.event}</h4>
                  <p>📅 {b.date}</p>
                  <p>💰 {b.amount}</p>
                  <span className="status confirmed">{b.status}</span>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            {historyBookings.length === 0 ? (
              <p>No past bookings.</p>
            ) : (
              historyBookings.map(b => (
                <div className="booked-card" key={b.id}>
                  <h4>{b.event}</h4>
                  <p>📅 {b.date}</p>
                  <p>💰 {b.amount}</p>
                  <span className="status completed">Completed</span>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "notifications" && (
          <div className="info-box">
            🔔 No new notifications yet.
          </div>
        )}

        {activeTab === "offers" && (
          <div className="info-box">
            🎁 Flat <strong>10% OFF</strong> on your next booking!
          </div>
        )}
      </div>
    </div>
  );
}
