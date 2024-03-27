import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login"; // Pfad entsprechend anpassen
//import Dashboard from "./components/Dashboard"; // Pfad entsprechend anpassen. Dashboard ist Ihre geschützte Route
import PrivateRoute from "./components/PrivateRoute.js"; // Pfad entsprechend anpassen
import AuthProvider from "./contexts/AuthContext"; // Pfad entsprechend anpassen

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute />}>
            
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          </Route>
          {/* Hier dann weitere geschützte Routen */}
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
