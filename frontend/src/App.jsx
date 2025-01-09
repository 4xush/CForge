import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import PrivateRoute from './pages/PrivateRoute';
import Settings from './pages/Settings';
import FullScreenLoader from './components/FullScreenLoader'; // Import your full-screen loader

const LoginPage = lazy(() => import('./pages/Login'));
const SignupPage = lazy(() => import('./pages/Signup'));
const WelcomePage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const RoomInviteHandler = lazy(() => import('./pages/RoomInviteHandler'));
const RoomLeaderboard = lazy(() => import('./pages/RoomLeaderboard'));
const RoomChat = lazy(() => import('./pages/RoomChat'));
const HelpFAQ = lazy(() => import('./pages/HelpFAQ'));
const NotFoundPage = lazy(() => import('./pages/Error404'));

const App = () => {
  useEffect(() => {
    const handlePopState = () => {
      window.location.reload(); // Reload the page when navigating back or forward
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <RoomProvider>
          <MessageProvider>
            <Toaster position="top-right" reverseOrder={false} />
            <Suspense
              fallback={
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
                  <FullScreenLoader /> {/* Full-screen loader */}
                </div>
              }
            >
              <Routes>
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<WelcomePage />} />
                {/* Layout */}
                <Route path="/404/" element={<NotFoundPage />} />
                <Route element={<Layout />}>
                  <Route path="/u/:username" element={<UserProfile />} />
                  <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                  <Route path="/rooms/:roomId/leaderboard" element={<PrivateRoute><RoomLeaderboard /></PrivateRoute>} />
                  <Route path="/rooms/:roomId/chat" element={<PrivateRoute><RoomChat /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  <Route path="/help" element={<PrivateRoute><HelpFAQ /></PrivateRoute>} />
                </Route>
                <Route path="/rooms/join/:inviteCode" element={<RoomInviteHandler />} />
              </Routes>
            </Suspense>
          </MessageProvider>
        </RoomProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;
