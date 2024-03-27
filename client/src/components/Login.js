import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [input, setInput] = useState({ username: "", password: "" });
  const { login } = useAuth();

  const handleSubmit = async (e) => {

    e.preventDefault();
    
    if (input.username && input.password) {
      login(input.username, input.password);
    } else {
      alert("Bitte Benutzername und Passwort eingeben");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Benutzername */}
      <div>
        <label htmlFor="username">Benutzername:</label>
        <input
          id="username"
          name="username"
          value={input.username}
          onChange={(e) => setInput({ ...input, username: e.target.value })}
        />
      </div>
      {/* Passwort */}
      <div>
        <label htmlFor="password">Passwort:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={input.password}
          onChange={(e) => setInput({ ...input, password: e.target.value })}
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
