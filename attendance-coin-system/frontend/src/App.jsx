import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/home';
import StudentDashboard from './pages/StudentDashboard';
import FacultyAttendance from './pages/FacultyAttendance';
import MessTerminal from './pages/MessTerminal';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Layout with Navigation (only for authenticated pages)
const AuthenticatedLayout = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-extrabold text-white tracking-wide drop-shadow-md">AttendanceCoin</span>
              {user && (
                <span className="ml-4 text-sm text-white/90 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  Welcome, <span className="font-bold text-white">{user.full_name}</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'student' && (
                <Link to="/dashboard" className="text-white hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-all">
                  Dashboard
                </Link>
              )}
              {user?.role === 'faculty' && (
                <Link to="/faculty" className="text-white hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-all">
                  Attendance
                </Link>
              )}
              {user?.role === 'mess_staff' && (
                <Link to="/mess" className="text-white hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-all">
                  Mess Terminal
                </Link>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin" className="text-white hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-all">
                    Admin Panel
                  </Link>
                  <Link to="/faculty" className="text-white hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-all">
                    Faculty
                  </Link>
                  <Link to="/mess" className="text-white hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-all">
                    Mess
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="bg-white text-fuchsia-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-bold shadow-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-6">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (no navigation header) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes (with navigation header) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <StudentDashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <FacultyAttendance />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mess"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <MessTerminal />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <AdminPanel />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
