import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import WelcomePage from './pages/LandingPage.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import { DashboardProvider } from './context/DashboardContext.jsx';
import { AuthProvider } from './context/AuthContext';
import { LeaderboardProvider } from './context/LeaderboardContext';
import { MessageProvider } from './context/MessageContext.jsx';
import { Toaster } from 'react-hot-toast';
import UserInfo from './components/UserProfile.jsx';
import RoomInviteHandler from './pages/RoomInviteHandler.jsx';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <RoomProvider>
          <LeaderboardProvider>
            <MessageProvider>
              <Toaster position="top-right" reverseOrder={false} />
              <Routes>
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/profile" element={<UserInfo />} />
                <Route
                  path="/dashboard/*"
                  element={
                    <DashboardProvider>
                      <DashboardPage />
                    </DashboardProvider>
                  }
                />
                {/* Handling the invite links */}
                <Route
                  path="/rooms/join/:inviteCode"
                  element={<RoomInviteHandler />}
                />
                <Route path="/" element={<Navigate to="/login" />} />
              </Routes>
            </MessageProvider>
          </LeaderboardProvider>
        </RoomProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;