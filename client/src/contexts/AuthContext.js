import React, { useContext, createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);


const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Direktes Setzen des Benutzerzustands aus dem Local Storage (sofern vorhanden)
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  
    if (token && !storedUser) {
      fetch("http://localhost:8000/verifyToken", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      })
      .then(response => response.json())
      .then(data => {
        if (data.username && data.userId) {
          const newUser = { username: data.username, id: data.userId };
          setUser(newUser);
          localStorage.setItem('user', JSON.stringify(newUser));
        } else {
          throw new Error("Token validation failed or user data incomplete");
        }
      })
      .catch(error => {
        console.error("Token verification failed:", error);

        // Wenn Token-Überprüfung fehlschlägt, entferne Token aus dem Local Storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        navigate("/login");
      });
    }
  }, [navigate]);
  


  
  const login = async (username, password) => {
    try {
      // Wichtig: Korrekten Endpunkt angeben, basierend auf das Backend und dem Port (TODO: In .env verschieben)
      const response = await fetch("http://localhost:8000/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser({ username });

        // Token im LocalStorage speichern
        localStorage.setItem("token", data.token);

        // Zielroute nach dem Login (im URL-Header)
        navigate("/dashboard");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const register = async (username, email, password) => {
    try {
      // Wichtig: Korrekten Endpunkt angeben, basierend auf das Backend und dem Port (TODO: In .env verschieben)
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {

        // Optional: Automatisches Einloggen des Benutzers nach Registrierung
        // login(username, password);
        alert("Registrierung erfolgreich. Bitte loggen Sie sich ein.");

        navigate("/login");
      } else {
        throw new Error(data.message || "Registrierung fehlgeschlagen");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;