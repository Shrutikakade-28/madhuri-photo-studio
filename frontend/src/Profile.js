import React, { useEffect, useState } from "react";
import "./Profile.css";
import mLogo from "./images/m-logo.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [newUsername, setNewUsername] = useState("");
    const [profileImg, setProfileImg] = useState(null);
    const navigate = useNavigate();

    const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "");

    // Load user info from localStorage
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
            setNewUsername(storedUser.name);
            setProfileImg(storedUser.profile_image || null);
            fetchBookings(storedUser.id);
        }
    }, []);

    const fetchBookings = async (userId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/bookings/user/${userId}`);
            setBookings(res.data.bookings || []);
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        }
    };

    const handleUsernameChange = async () => {
        if (!newUsername) return alert("Username cannot be empty!");
        try {
            const res = await axios.put(`${API_BASE}/api/users/${user.id}`, { name: newUsername });
            if (res.data.success) {
                alert("✅ Username updated!");
                setUser({ ...user, name: newUsername });
                localStorage.setItem("user", JSON.stringify({ ...user, name: newUsername }));
            }
        } catch (err) {
            console.error("Failed to update username", err);
            alert("❌ Failed to update username.");
        }
    };

    const handleProfileImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("profile_image", file);

        try {
            const res = await axios.put(`${API_BASE}/api/users/${user.id}/profile-image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) {
                alert("✅ Profile image updated!");
                setProfileImg(res.data.profile_image);
                setUser({ ...user, profile_image: res.data.profile_image });
                localStorage.setItem("user", JSON.stringify({ ...user, profile_image: res.data.profile_image }));
            }
        } catch (err) {
            console.error("Failed to upload profile image", err);
            alert("❌ Failed to upload image.");
        }
    }; 

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    return (
        <div className="profile-page">
            <div className="profile-card">
                <h2>My Profile</h2>
                <button className="close-btn" onClick={() => navigate("/home")}>
                    ✕
                </button>
                <div className="profile-image-section">
                    <img
                        src={profileImg || mLogo}
                        alt="Profile"
                        className="profile-img-large"
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                    />
                </div>
                <div className="profile-username-section">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                    />
                    <button onClick={handleUsernameChange}>Update</button>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
                <div className="profile-bookings">
                    <h3>My Bookings</h3>
                    {bookings.length === 0 ? (
                        <p>No bookings yet.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Event</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b.id}>
                                        <td>{b.event_type}</td>
                                        <td>{new Date(b.booking_date).toLocaleDateString()}</td>
                                        <td>{b.status}</td>
                                        <td>₹{b.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
