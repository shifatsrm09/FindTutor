import React from "react";

function Dashboard({ user, onLogout }) {

    return (
        <div style={styles.page}>

            <div style={styles.card}>

                <h1>
                    Welcome {user.role === "student"
                        ? "Student"
                        : "Tutor"}!
                </h1>

                <h2>
                    {user.fullName}
                </h2>

                <p>
                    Email: {user.email}
                </p>

                <p>
                    Role: {user.role}
                </p>

                <button onClick={onLogout}>
                    Logout
                </button>

            </div>

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

    card: {
        padding: "40px",
        background: "#1e1e1e",
        borderRadius: "12px",
        textAlign: "center"
    }
};

export default Dashboard;