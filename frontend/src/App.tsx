import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import OptimalRouteForm from "./components/OptimalRouteForm";
import VisitHistory from "./components/VisitHistory";
import HouseVisitHistory from "./components/HouseVisitHistory";
import PhoneNumberForm from "./components/PhoneNumberForm";
import Dashboard from "./components/Dashboard";
import UserDashboard from "./components/UserDashboard";

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-gray-900 min-h-screen text-white">
        {/* Top Navigation Bar */}
        <nav className="bg-gray-800 p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-400">
              Smart Route Tracker
            </h1>
            <div className="flex space-x-6">
              <Link
                className="text-white hover:text-blue-400 transition duration-200"
                to="/"
              >
                Optimal Route
              </Link>

              <Link
                className="text-white hover:text-blue-400 transition duration-200"
                to="/Dashboard"
              >
                Admin Dashboard
              </Link>
              {/* <Link
                className="text-white hover:text-blue-400 transition duration-200"
                to="/UserDashboard"
              >
                User Dashboard
              </Link> */}
              <Link
                className="text-white hover:text-blue-400 transition duration-200"
                to="/history"
              >
                Visit History
              </Link>
              <Link
                className="text-white hover:text-blue-400 transition duration-200"
                to="/visithistory"
              >
                House Visit History
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-full max-w-4xl px-4">
            {" "}
            {/* Ensures content width is constrained */}
            <Routes>
              <Route path="/" element={<OptimalRouteForm />} />
              <Route path="/history" element={<VisitHistory />} />
              <Route path="/visithistory" element={<HouseVisitHistory />} />
              <Route path="/Dashboard" element={<Dashboard />} />
              <Route path="/UserDashboard" element={<UserDashboard />} />

              <Route path="/set-phone" element={<PhoneNumberForm />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
