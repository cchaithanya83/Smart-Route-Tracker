import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import OptimalRouteForm from "./components/OptimalRouteForm";
import VisitHistory from "./components/VisitHistory";
import HouseVisitHistory from "./components/HouseVisitHistory";
import Dashboard from "./components/Dashboard";
import UserDashboard from "./components/UserDashboard";
import About from "./components/About";
import QueryManagement from "./components/Query";

// Admin Layout
const AdminLayout: React.FC = ({ children }) => (
  <div className="bg-gray-900 min-h-screen text-white">
    <nav className="bg-gray-800 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-red-400">Admin Panel</h1>
        <div className="flex space-x-6">
          <a
            href="/admin/Dashboard"
            className="text-white hover:text-red-400 transition"
          >
            Dashboard
          </a>
          <a
            href="/admin/OptimalRouteForm"
            className="text-white hover:text-blue-400 transition"
          >
            Optimal Route
          </a>
          <a
            href="/admin/history"
            className="text-white hover:text-red-400 transition"
          >
            Visit History
          </a>
          <a
            href="/admin/Query"
            className="text-white hover:text-red-400 transition"
          >
            Query Management
          </a>
        </div>
      </div>
    </nav>
    <main className="container mx-auto py-6">{children}</main>
  </div>
);

// User Layout
const UserLayout: React.FC = ({ children }) => (
  <div className="bg-gray-900 min-h-screen text-white">
    <nav className="bg-gray-800 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-400">
          Smart Route Tracker
        </h1>
        <div className="flex space-x-6">
          <a
            href="/user/About"
            className="text-white hover:text-blue-400 transition"
          >
            About
          </a>

          <a
            href="/user/UserDashboard"
            className="text-white hover:text-blue-400 transition"
          >
            Dashboard
          </a>
        </div>
      </div>
    </nav>
    <main className="container mx-auto py-6">{children}</main>
  </div>
);

// App Component
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route
          path="admin/*"
          element={
            <AdminLayout>
              <Routes>
                <Route path="Dashboard" element={<Dashboard />} />
                <Route path="history" element={<VisitHistory />} />
                <Route path="OptimalRouteForm" element={<OptimalRouteForm />} />
                <Route path="Query" element={<QueryManagement />} />
                <Route path="*" element={<Navigate to="/admin/Dashboard" />} />
              </Routes>
            </AdminLayout>
          }
        />

        {/* User Routes */}
        <Route
          path="user/*"
          element={
            <UserLayout>
              <Routes>
                <Route path="About" element={<About />} />
                <Route path="UserDashboard" element={<UserDashboard />} />
                <Route path="*" element={<Navigate to="/user/About" />} />
              </Routes>
            </UserLayout>
          }
        />

        {/* Default Fallback */}
        <Route path="*" element={<Navigate to="/user/About" />} />
      </Routes>
    </Router>
  );
};

export default App;
