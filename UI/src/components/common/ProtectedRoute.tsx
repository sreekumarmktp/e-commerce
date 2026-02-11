import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { checkAuth } from '../../store/slices/authSlice';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    if (loading) {
        return <div>Loading...</div>; // Replace with proper loading spinner
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && user?.role !== 'admin') {
        return <Navigate to="/" replace />; // Or unauthorized page
    }

    return <>{children}</>;
};

export default ProtectedRoute;
