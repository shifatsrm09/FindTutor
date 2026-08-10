import React, { useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function App() {

    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {

        setUser(userData);
        setPage("dashboard");
    };

    const handleLogout = () => {

        setUser(null);
        setPage("login");
    };

    if (user && page === "dashboard") {

        return (
            <Dashboard
                user={user}
                onLogout={handleLogout}
            />
        );
    }

    if (page === "signup") {

        return (
            <Signup
                onLogin={handleLogin}
            />
        );
    }

    return (
        <Login
            onLogin={handleLogin}
            goToSignup={() => setPage("signup")}
        />
    );
}

export default App;