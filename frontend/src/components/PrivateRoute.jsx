import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import FullScreenLoader from '../components/FullScreenLoader';

const PrivateRoute = ({ children }) => {
    const { authUser, isLoading } = useAuthContext();
    const location = useLocation();

    // Show the full-screen loader while authUser is being determined
    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
                <FullScreenLoader />
            </div>
        );
    }

    // Only redirect if the user is not authenticated AND not already on the login or signup page
    if (!authUser && location.pathname !== '/login' && location.pathname !== '/signup') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Render the protected component if the user is authenticated
    return children;
};

export default PrivateRoute;