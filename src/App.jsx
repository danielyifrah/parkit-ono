import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ParkingProvider } from './context/ParkingContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookingSessionGuard from './components/BookingSessionGuard';
import RoleRoute from './components/RoleRoute';
import { USER_ROLES } from './lib/roles';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import ParkingDetails from './pages/ParkingDetails';
import Booking from './pages/Booking';
import SavedParking from './pages/SavedParking';
import ActiveParking from './pages/ActiveParking';
import History from './pages/History';
import BookingHistoryDetails from './pages/BookingHistoryDetails';
import Profile from './pages/Profile';
import Support from './pages/Support';
import OwnerDashboard from './pages/OwnerDashboard';
import AddParking from './pages/AddParking';

export default function App() {
  return (
    <AuthProvider>
      <ParkingProvider>
        <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route element={<BookingSessionGuard />}>
            {/* Public routes inside layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/parking/:id" element={<ProtectedRoute><ParkingDetails /></ProtectedRoute>} />
            <Route path="/parking/:id/book" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedParking /></ProtectedRoute>} />
            <Route path="/active" element={<ProtectedRoute><ActiveParking /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/history/:id" element={<ProtectedRoute><BookingHistoryDetails /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route
              path="/partner"
              element={(
                <RoleRoute roles={[USER_ROLES.OWNER]}>
                  <OwnerDashboard />
                </RoleRoute>
              )}
            />
            <Route
              path="/partner/add"
              element={(
                <RoleRoute roles={[USER_ROLES.OWNER]}>
                  <AddParking />
                </RoleRoute>
              )}
            />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </ParkingProvider>
    </AuthProvider>
  );
}
