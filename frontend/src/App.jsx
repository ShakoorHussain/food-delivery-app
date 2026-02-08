import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/authContext';
import { SocketProvider } from './components/auth/socketContext';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Auth Components
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Customer Components
import RestaurantList from './components/customer/RestaurantList';
import RestaurantDetail from './components/customer/RestaurantDetail';
import Cart from './components/customer/Cart';
import OrderHistory from './components/customer/OrderHistory';

// Restaurant Components
import RestaurantDashboard from './components/restaurant/RestaurantDashboard';
import AddMenuItem from './components/restaurant/AddMenuItem';
import EditMenuItem from './components/restaurant/EditMenuItem';

// Delivery Components
import DeliveryDashboard from './components/delivery/DeliveryDashboard';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer Routes (Protected) */}
            <Route
              path="/restaurants"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <RestaurantList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/restaurant/:id"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <RestaurantDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Cart />
                </ProtectedRoute>
              }
            />

            <Route
              path="/order-history"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />

            {/* Restaurant Routes (Protected) */}
            <Route
              path="/restaurant-dashboard"
              element={
                <ProtectedRoute allowedRoles={['restaurant']}>
                  <RestaurantDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/restaurant/add-menu-item"
              element={
                <ProtectedRoute allowedRoles={['restaurant']}>
                  <AddMenuItem />
                </ProtectedRoute>
              }
            />

            <Route
              path="/restaurant/edit-menu-item/:id"
              element={
                <ProtectedRoute allowedRoles={['restaurant']}>
                  <EditMenuItem />
                </ProtectedRoute>
              }
            />

            {/* Delivery Routes (Protected) */}
            <Route
              path="/delivery-dashboard"
              element={
                <ProtectedRoute allowedRoles={['delivery']}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;