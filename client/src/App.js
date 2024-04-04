import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute.js";
import AuthProvider from "./contexts/AuthContext";
import LoginAndRegister from "./components/LoginAndRegister.js";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
        <Route path="/" element={<LoginAndRegister />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute />}>          
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          {/* Hier dann weitere geschützte Routen */}
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;