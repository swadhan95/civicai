import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicMapPage from './pages/PublicMapPage';

// Citizen Pages
import ReportIssuePage from './pages/citizen/ReportIssuePage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import MyComplaintsPage from './pages/citizen/MyComplaintsPage';
import ComplaintDetailPage from './pages/citizen/ComplaintDetailPage';
import LeaderboardPage from './pages/citizen/LeaderboardPage';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerComplaintDetailPage from './pages/officer/OfficerComplaintDetailPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/map" element={<PublicMapPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

                {/* Citizen Routes */}
                <Route
                  path="/report"
                  element={
                    <ProtectedRoute allowedRoles={['CITIZEN', 'OFFICER', 'ADMIN']}>
                      <ReportIssuePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/citizen/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['CITIZEN', 'OFFICER', 'ADMIN']}>
                      <CitizenDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/citizen/complaints"
                  element={
                    <ProtectedRoute allowedRoles={['CITIZEN', 'OFFICER', 'ADMIN']}>
                      <MyComplaintsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Officer Routes */}
                <Route
                  path="/officer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                      <OfficerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/complaints/:id"
                  element={
                    <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                      <OfficerComplaintDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/departments"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminSettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
