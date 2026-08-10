import React, { useState } from "react";

function Login({ onLogin, goToSignup }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Login failed."
                );
            }

            // Send user AND token to App.js
            onLogin(
                data.user,
                data.token
            );

        } catch (error) {

            setError(error.message);

        } finally {

            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>

            <form
                onSubmit={handleSubmit}
                style={styles.form}
            >

                <h1>Find Tutor</h1>

                <h2>Login</h2>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "Logging in..."
                        : "Login"}
                </button>

                {error && (
                    <p style={styles.error}>
                        {error}
                    </p>
                )}

                <p>
                    Don't have an account?
                </p>

                <button
                    type="button"
                    onClick={goToSignup}
                >
                    Create Account
                </button>

            </form>

        </div>
    );
}

const styles = {

    page: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
        color: "white"
    },

    form: {
        width: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "30px",
        background: "#1e1e1e",
        borderRadius: "12px"
    },

    error: {
        color: "#f87171"
    }

};

export default Login;