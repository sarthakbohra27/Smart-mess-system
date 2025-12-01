import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StudentDashboard from './pages/StudentDashboard';
import FacultyAttendance from './pages/FacultyAttendance';
import MessTerminal from './pages/MessTerminal';
import AdminPanel from './pages/AdminPanel';

import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Navigation for Demo Purposes */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold text-blue-600">AttendanceCoin</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                <Link to="/" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Student</Link>
                <Link to="/faculty" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Faculty</Link>
                <Link to="/mess" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Mess</Link>
                <Link to="/admin" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Admin</Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="py-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<StudentDashboard />} />
            <Route path="/faculty" element={<FacultyAttendance />} />
            <Route path="/mess" element={<MessTerminal />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
