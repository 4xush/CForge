import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import FullScreenLoader from './components/FullScreenLoader';

// Lazy loaded components
const LoginPage = React.lazy(() => import('./pages/Login'));
const SignupPage = React.lazy(() => import('./pages/Signup'));
const WelcomePage = React.lazy(() => import('./pages/LandingPage'));
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const UserProfile = React.lazy(() => import('./components/UserProfile'));
const RoomInviteHandler = React.lazy(() => import('./pages/RoomInviteHandler'));
const RoomLeaderboard = React.lazy(() => import('./pages/RoomLeaderboardPage'));
const RoomChat = React.lazy(() => import('./pages/RoomChatPage'));
const HelpFAQ = React.lazy(() => import('./pages/HelpFAQ'));
const NotFoundPage = React.lazy(() => import('./pages/Error404'));
const Settings = React.lazy(() => import('./pages/Settings'));

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <RoomProvider>
            <MessageProvider>
              <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: '#333',
                    color: '#fff',
                  },
                }}
              />
              <Suspense
                fallback={
                  <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
                    <FullScreenLoader />
                  </div>
                }
              >
                <Routes>
                  {/* Public routes */}
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<WelcomePage />} />
                  <Route path="/404" element={<NotFoundPage />} />

                  {/* Protected routes within Layout */}
                  <Route element={<Layout />}>
                    <Route
                      path="/u/:username"
                      element={
                        <ErrorBoundary>
                          <UserProfile />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <PrivateRoute>
                          <ErrorBoundary>
                            <DashboardPage />
                          </ErrorBoundary>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/rooms/:roomId/leaderboard"
                      element={
                        <PrivateRoute>
                          <ErrorBoundary>
                            <RoomLeaderboard />
                          </ErrorBoundary>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/rooms/:roomId/chat"
                      element={
                        <PrivateRoute>
                          <ErrorBoundary>
                            <RoomChat />
                          </ErrorBoundary>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <PrivateRoute>
                          <ErrorBoundary>
                            <Settings />
                          </ErrorBoundary>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/help"
                      element={
                        <PrivateRoute>
                          <ErrorBoundary>
                            <HelpFAQ />
                          </ErrorBoundary>
                        </PrivateRoute>
                      }
                    />
                  </Route>

                  {/* Special routes */}
                  <Route
                    path="/rooms/join/:inviteCode"
                    element={
                      <ErrorBoundary>
                        <RoomInviteHandler />
                      </ErrorBoundary>
                    }
                  />

                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
            </MessageProvider>
          </RoomProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;