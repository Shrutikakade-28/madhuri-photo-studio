import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import mLogo from "./images/m-logo.png";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/bookings")
      .then((res) => setBookings(res.data.bookings || []))
      .catch((err) => console.log(err));
  }, []);

  const pending = bookings.filter((b) => b.status === "pending");
  const completed = bookings.filter((b) => b.status === "completed");

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
        </section>
      </div>
    </div>
  );
}
