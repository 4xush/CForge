import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import CreateRoomPage from './components/RoomCreation/CreateJoinRoomModal.jsx';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import WelcomePage from './pages/LandingPage.jsx';
import DashboardPage from './components/Dashboard.jsx';
import { DashboardProvider } from './context/DashboardContext.jsx';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import UserInfo from './components/User';
import RoomInviteHandler from './pages/RoomInviteHandler.jsx';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <RoomProvider>
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
            <Route path="/room/create" element={<CreateRoomPage />} />
            {/* Handle invite links */}
            <Route
              path="/rooms/join/:inviteCode"
              element={<RoomInviteHandler />}
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </RoomProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;