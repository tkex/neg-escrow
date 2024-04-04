import React, { useContext, createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const { token } = authState;

    if (token) {
      fetch("http://localhost:8000/verifyToken", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      })
        .then(response => response.json())
        .then(data => {
          if (data.username && data.userId) {
            setAuthState(prevState => ({
              ...prevState,
              user: { username: data.username, id: data.userId },
            }));
            localStorage.setItem('user', JSON.stringify({ username: data.username, id: data.userId }));
          } else {
            throw new Error("Token Verifikation fehlgeschlagen oder Userdaten nicht vollständig");
          }
        })
        .catch(error => {
          console.error("Token Verifikation fehlgeschlagen:", error);
          logout(); 
        });
    }
  }, [navigate, authState.token]);

  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:8000/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setAuthState({ user: { username }, token: data.token });
        localStorage.setItem("token", data.token);
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
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // Automatisches Einloggen nach Registrierung
        login(username, password);
  
        // Benutzer zur Login-Seite leiten statt eingeloggt bleiben
        //alert("Registrierung erfolgreich. Bitte loggen Sie sich ein.");
        //navigate("/login");
      } else {
        throw new Error(data.message || "Registrierung fehlgeschlagen");
      }
    } catch (error) {
      alert(error.message);
    }
  };
  


  const logout = () => {
    setAuthState({ user: null, token: null });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
