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
      fetch("http://localhost:8000/api/users/verifyToken", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      }).then(response => response.json())
        .then(data => {
          if (data.username && data.userId) {
            setAuthState(prevState => ({
              ...prevState,
              user: { username: data.username, id: data.userId },
            }));
            localStorage.setItem('user', JSON.stringify({ username: data.username, id: data.userId }));
          } else {
            throw new Error("Token verification failed or incomplete user data");
          }
        }).catch(error => {
          console.error("Token verification failed:", error);
          logout();
        });
    }
  }, [authState.token]);

  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:8000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setAuthState({ user: { username, id: data.userId }, token: data.token });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({ username, id: data.userId }));
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
      const response = await fetch("http://localhost:8000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        login(username, password);
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = () => {
    setAuthState({ user: null, token: null });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
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
