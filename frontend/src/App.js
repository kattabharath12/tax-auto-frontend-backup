import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import DocumentUpload from './pages/DocumentUpload';
import TaxForms from './pages/TaxForms';
import PaymentPage from './pages/PaymentPage';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './components/Dashboard';
import { isAuthenticated } from './utils/auth';

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route path="profile" element={<Profile />} />
          <Route path="upload" element={<DocumentUpload />} />
          <Route path="forms" element={<TaxForms />} />
          <Route path="payments" element={<PaymentPage />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;