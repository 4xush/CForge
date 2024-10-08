import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import CreateRoomPage from './components/CreateRoomForm';
import { DashboardProvider } from './context/DashboardContext.jsx';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import WelcomePage from './pages/Welcome';
import DashboardPage from './components/Dashboard.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/welcome" element={<WelcomePage />} />

        {/* Wrap the DashboardPage with DashboardProvider */}
        <Route
          path="/dashboard"
          element={
            <DashboardProvider>
              <DashboardPage />
            </DashboardProvider>
          }
        />

        <Route path="/room/create" element={<CreateRoomPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;
