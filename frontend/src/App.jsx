// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignupPage from './pages/Signup';
import LoginPage from './pages/Login';
import WelcomePage from './pages/Welcome';
import DashboardPage from './pages/Dashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignupPage/>} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/welcome" element={<WelcomePage/>} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;
