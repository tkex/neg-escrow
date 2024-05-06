
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
    <form onSubmit={handleSubmit} className="max-w-md mx-auto my-10 p-8 border rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-8 text-center">Login</h1>
      {/* Benutzername */}
      <div className="mb-6">
        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900">Benutzername:</label>
        <input
          type="text"
          id="username"
          name="username"
          value={input.username}
          onChange={(e) => setInput({ ...input, username: e.target.value })}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
      </div>
      {/* Passwort */}
      <div className="mb-6">
        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">Passwort:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={input.password}
          onChange={(e) => setInput({ ...input, password: e.target.value })}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
      </div>
      <button type="submit" className="text-white bg-blue-500 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Login</button>
    </form>
  );
};

export default Login;
