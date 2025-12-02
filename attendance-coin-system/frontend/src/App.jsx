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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">AttendanceCoin</span>
              {user && (
                <span className="ml-4 text-sm text-gray-600">
                  Welcome, <span className="font-semibold">{user.full_name}</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'student' && (
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
              )}
              {user?.role === 'faculty' && (
                <Link to="/faculty" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Attendance
                </Link>
              )}
              {user?.role === 'mess_staff' && (
                <Link to="/mess" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Mess Terminal
                </Link>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Admin Panel
                  </Link>
                  <Link to="/faculty" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Faculty
                  </Link>
                  <Link to="/mess" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Mess
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
