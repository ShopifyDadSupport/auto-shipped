// index.js
import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import App from "./App";
import LoginPage from "./LoginPage";

const root = ReactDOM.createRoot(document.getElementById("root"));

const shouldRenderLoginPage =
  window.location.href === "https://auto-shipped.onrender.com/";

const Main = () => {
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  useEffect(() => {
    if (loggedIn) {
      localStorage.setItem("isLoggedIn", "true");
    } else {
      localStorage.removeItem("isLoggedIn");
    }
  }, [loggedIn]);

  if (shouldRenderLoginPage && !loggedIn) {
    return <LoginPage setLoggedIn={setLoggedIn} />;
  }

  return <App />;
};

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Main />
    </BrowserRouter>
  </React.StrictMode>
);
