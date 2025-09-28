import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProductListingPage from './pages/products/ProductListingPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import ProfilePage from './pages/profile/ProfilePage';
import OrdersPage from './pages/orders/OrdersPage';
import AddressesPage from './pages/profile/AddressesPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReturns from './pages/admin/AdminReturns';
import ReturnDetailPage from './pages/admin/ReturnDetailPage';
import React from 'react';
import ProductForm from './pages/admin/ProductForm';
import WishlistPage from './pages/wishlist/WishlistPage';
import ContactPage from './pages/contact/ContactPage';
import UserEditPage from './pages/admin/UserEditPage';
import UserViewPage from './pages/admin/UserViewPage';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Redirect to home if already logged in
const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/products" />;
  }
  
  return <>{children}</>;
};

// Admin Route component to check for admin role
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        } 
      />
      <Route 
        path="/register" 
        element={
          <RedirectIfAuthenticated>
            <RegisterPage />
          </RedirectIfAuthenticated>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <RedirectIfAuthenticated>
            <ForgotPasswordPage />
          </RedirectIfAuthenticated>
        } 
      />
      <Route 
        path="/reset-password/:token" 
        element={<ResetPasswordPage />} 
      />
      
      {/* Products Routes */}
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <ProductListingPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/products/:id" 
        element={
          <ProtectedRoute>
            <ProductDetailPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Gender-based Routes */}
      <Route 
        path="/men" 
        element={
          <ProtectedRoute>
            <ProductListingPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/women" 
        element={
          <ProtectedRoute>
            <ProductListingPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/kids" 
        element={
          <ProtectedRoute>
            <ProductListingPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/genz" 
        element={
          <ProtectedRoute>
            <ProductListingPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Cart Routes */}
      <Route 
        path="/cart" 
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Checkout Route */}
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } 
      />

      {/* Profile Routes */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/addresses" 
        element={
          <ProtectedRoute>
            <AddressesPage />
          </ProtectedRoute>
        } 
      />

      {/* Wishlist Route */}
      <Route 
        path="/wishlist" 
        element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        } 
      />

      {/* Contact Us Route */}
      <Route 
        path="/contact" 
        element={
          <ProtectedRoute>
            <ContactPage />
          </ProtectedRoute>
        } 
      />

      {/* Order Routes */}
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/orders/:id" 
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/returns" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-8">
              <h1 className="text-2xl font-bold mb-4">Return Requests</h1>
              <p>Return requests feature is coming soon!</p>
            </div>
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/products" 
        element={
          <AdminRoute>
            <AdminProducts />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/orders" 
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        } 
      />
      
      {/* New route for editing users */}
      <Route 
        path="/admin/users/:email/edit" 
        element={
          <AdminRoute>
            <UserEditPage />
          </AdminRoute>
        } 
      />
      
      {/* Additional admin routes */}
      <Route 
        path="/admin/users/:email/orders" 
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/products/edit/:id" 
        element={
          <AdminRoute>
            <AdminProducts />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/products/edit/:id/form" 
        element={
          <AdminRoute>
            <ProductForm />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/products/add" 
        element={
          <AdminRoute>
            <ProductForm />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/orders/:id" 
        element={
          <AdminRoute>
            <OrderDetailPage />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/returns" 
        element={
          <AdminRoute>
            <AdminReturns />
          </AdminRoute>
        } 
      />
      
      <Route 
        path="/admin/returns/:id" 
        element={
          <AdminRoute>
            <ReturnDetailPage />
          </AdminRoute>
        } 
      />
      
      {/* New route for viewing user */}
      <Route 
        path="/admin/users/:email/view" 
        element={
          <AdminRoute>
            <UserViewPage />
          </AdminRoute>
        } 
      />
      
      {/* Redirect root to products */}
      <Route path="/" element={<Navigate to="/products" />} />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/products" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRoutes />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
