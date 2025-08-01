import React, { Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { RoomProvider } from "./context/RoomContext";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { MessageProvider } from "./context/MessageContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { ReminderProvider } from "./context/ReminderContext";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout/Layout.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import FullScreenLoader from "./components/FullScreenLoader";
import RoomPage from "./pages/RoomPage.jsx";
import AboutCForge from "./pages/AboutCForge";
import toast from "react-hot-toast";
// Lazy loaded components
const LoginPage = React.lazy(() => import("./pages/Login"));
const SignupPage = React.lazy(() => import("./pages/Signup"));
const WelcomePage = React.lazy(() => import("./pages/LandingPage.jsx"));
const DashboardPage = React.lazy(() =>
  import("./components/UserDashboard.jsx")
);
const PublicUserProfile = React.lazy(() => import("./pages/PublicUser.jsx"));
const RoomInviteHandler = React.lazy(() => import("./pages/RoomInviteHandler"));
const RoomLeaderboard = React.lazy(() => import("./pages/RoomLeaderboardPage"));
const RoomChat = React.lazy(() => import("./pages/RoomChatPage"));
const HelpFAQ = React.lazy(() => import("./pages/HelpFAQ"));
const NotFoundPage = React.lazy(() => import("./pages/Error404"));
const Settings = React.lazy(() => import("./pages/Settings"));
const ContestsPage = React.lazy(() => import("./pages/ContestsPage.jsx"));
const ReviewsPage = React.lazy(() => import("./pages/ReviewsPage.jsx"));
const ProblemTrackerPage = React.lazy(() =>
  import("./components/ProblemTracker/ProblemTrackerDashboard.jsx")
);

// Smart landing route handler
const AuthLanding = () => {
  const { authUser, isLoading } = useAuthContext();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const forceVisit = searchParams.get("force") === "true";

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <FullScreenLoader />
      </div>
    );
  }

  if (authUser && !forceVisit) {
    return <Navigate to="/dashboard" replace />;
  }

  return <WelcomePage />;
};

const App = () => {
  // ✅ One-time cache cleaner
  useEffect(() => {
    const clearOldServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }

          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            await caches.delete(name);
          }

          toast.success("App updated! Reloading...");
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          window.location.reload();
        } catch (err) {
          console.warn("Cache clearing failed:", err);
        }
      }
    };

    const clearedKey = "cache_fixed_v1";
    if (!localStorage.getItem(clearedKey)) {
      clearOldServiceWorker().then(() => {
        localStorage.setItem(clearedKey, "true");
      });
    }
  }, []);

  const Logout = () => {
    useEffect(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/login");
    }, []);
    return null;
  };

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <WebSocketProvider>
            <ReminderProvider>
              <RoomProvider>
                <Toaster
                  position="top-right"
                  reverseOrder={false}
                  toastOptions={{
                    duration: 5000,
                    style: {
                      background: "#333",
                      color: "#fff",
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
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/" element={<AuthLanding />} />
                    <Route path="/about" element={<AboutCForge />} />
                    <Route path="/reviews" element={<ReviewsPageWrapper />} />
                    <Route path="/404" element={<NotFoundPage />} />

                    {/* Protected routes inside layout */}
                    <Route element={<Layout />}>
                      <Route
                        path="/contest-central"
                        element={<ContestsPage />}
                      />
                      <Route
                        path="/u/:username"
                        element={
                          <ErrorBoundary>
                            <PublicUserProfile />
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
                        path="/rooms/"
                        element={
                          <PrivateRoute>
                            <ErrorBoundary>
                              <RoomPage />
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
                              <MessageProvider>
                                <RoomChat />
                              </MessageProvider>
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
                        path="/leetcode-tracker"
                        element={
                          <PrivateRoute>
                            <ErrorBoundary>
                              <ProblemTrackerPage />
                            </ErrorBoundary>
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/help"
                        element={
                          <ErrorBoundary>
                            <HelpFAQ />
                          </ErrorBoundary>
                        }
                      />
                    </Route>

                    {/* Invite route (public) */}
                    <Route
                      path="/rooms/join/:inviteCode"
                      element={
                        <ErrorBoundary>
                          <RoomInviteHandler />
                        </ErrorBoundary>
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
              </RoomProvider>
            </ReminderProvider>
          </WebSocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

const ReviewsPageWrapper = () => {
  const { authUser, isLoading } = useAuthContext();
  if (isLoading) return null;
  return <ReviewsPage isAuthUser={!!authUser} />;
};

export default App;
