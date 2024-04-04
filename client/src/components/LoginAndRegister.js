import React from "react";
import Login from "./Login";
import Register from "./Register";

const LoginAndRegister = () => {
  return (
    <div style={{ display: "flex", justifyContent: "space-around" }}>
      <Login />
      <Register />
    </div>
  );
};

export default LoginAndRegister;