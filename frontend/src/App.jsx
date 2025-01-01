import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import { DashboardProvider } from './context/DashboardContext';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

const LoginPage = lazy(() => import('./pages/Login'));
const SignupPage = lazy(() => import('./pages/Signup'));
const WelcomePage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const UserInfo = lazy(() => import('./components/UserProfile'));
const RoomInviteHandler = lazy(() => import('./pages/RoomInviteHandler'));
const RoomLeaderboard = lazy(() => import('./pages/RoomLeaderboard'));
const RoomChat = lazy(() => import('./pages/RoomChat'));

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <RoomProvider>
          <MessageProvider>
            <DashboardProvider>
              <Toaster position="top-right" reverseOrder={false} />
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/welcome" element={<WelcomePage />} />
                  {/* layout */}
                  <Route element={<Layout />}>
                    <Route path="/profile" element={<PrivateRoute><UserInfo /></PrivateRoute>} />
                    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/rooms/:roomId/leaderboard" element={<PrivateRoute><RoomLeaderboard /></PrivateRoute>} />
                    <Route path="/rooms/:roomId/chat" element={<PrivateRoute><RoomChat /></PrivateRoute>} />
                  </Route>
                  <Route path="/rooms/join/:inviteCode" element={<RoomInviteHandler />} />
                  <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
              </Suspense>
            </DashboardProvider>
          </MessageProvider>
        </RoomProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;

