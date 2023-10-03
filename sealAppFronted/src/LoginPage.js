import React, { useState } from "react";
import axios from "axios";

function LoginPage({ setLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    axios
      .post("https://auto-shipped.onrender.com/userauth", {
        username: username,
        password: password
      })
      .then((response) => {
        // Assuming response.data.token is the authentication token
        const token = response.data.token;
        if (token) {
          setLoggedIn(true);
          localStorage.setItem("token", token);
          localStorage.setItem("isLoggedIn", "true");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div>
      <h1>Login Page</h1>
      <div>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default LoginPage;
