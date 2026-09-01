import React, { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import MvpDashboard from "./pages/MvpDashboard";
import { API_URL } from "./config";

function App() {

    const [page, setPage] = useState("loading");
    const [user, setUser] = useState(null);

    // ==================================================
    // CHECK EXISTING LOGIN
    // ==================================================

    useEffect(() => {

        const token = localStorage.getItem(
            "findTutorToken"
        );

        // No token means user is not logged in
        if (!token) {
            setPage("login");
            return;
        }

        // Ask backend to verify the token
        fetch(
            `${API_URL}/api/auth/me`,
            {
                method: "GET",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
            .then(async (response) => {

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Authentication failed."
                    );
                }

                return data;
            })
            .then((data) => {

                // Token is valid
                setUser(data.user);
                setPage("dashboard");

            })
            .catch(() => {

                // Token is invalid/expired
                localStorage.removeItem(
                    "findTutorToken"
                );

                setUser(null);
                setPage("login");
            });

    }, []);

    // ==================================================
    // LOGIN
    // ==================================================

    const handleLogin = (userData, token) => {

        // Save token so login survives refresh
        localStorage.setItem(
            "findTutorToken",
            token
        );

        setUser(userData);
        setPage("dashboard");
    };

    // ==================================================
    // LOGOUT
    // ==================================================

    const handleLogout = () => {

        localStorage.removeItem(
            "findTutorToken"
        );

        setUser(null);
        setPage("login");
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (page === "loading") {

        return (
            <div style={styles.loading}>
                Checking login...
            </div>
        );
    }

    // ==================================================
    // DASHBOARD
    // ==================================================

    if (
        user &&
        page === "dashboard"
    ) {

        if (user.role === "admin") {
            return <AdminDashboard onLogout={handleLogout} />;
        }

        return <MvpDashboard user={user} onLogout={handleLogout} />;
    }

    // ==================================================
    // SIGNUP
    // ==================================================

    if (page === "signup") {

        return (
            <Signup
                goToLogin={() =>
                    setPage("login")
                }
            />
        );
    }

    // ==================================================
    // LOGIN
    // ==================================================

    return (
        <Login
            onLogin={handleLogin}
            goToSignup={() =>
                setPage("signup")
            }
        />
    );
}

const styles = {

    loading: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
        color: "white",
        fontSize: "20px"
    }

};

export default App;
