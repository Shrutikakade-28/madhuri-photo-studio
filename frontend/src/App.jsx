import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landingpage from './Landingpage';
import Home from './Home';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './LoginAdmin';
import Booked from "./Booked";
// Auth helper functions
const isUserAuthenticated = () => !!localStorage.getItem('user');
const isAdminAuthenticated = () => !!localStorage.getItem('adminToken');

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Landingpage />} />

        {/* User Protected Route */}
        <Route
          path="/home"
          element={isUserAuthenticated() ? <Home /> : <Navigate to="/" />}
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={isAdminAuthenticated() ? <AdminDashboard /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin"
          element={isAdminAuthenticated() ? <AdminDashboard /> : <Navigate to="/admin/login" />}
        />
        <Route path="/booked-events" element={<Booked />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
