import React, { useState } from "react";

function Dashboard({ user, onLogout }) {
    const [reportedUserID, setReportedUserID] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submitComplaint = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setSubmitting(true);

        try {
            const token = localStorage.getItem("findTutorToken");
            const response = await fetch("http://localhost:5000/api/complaints", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reportedUserID: Number(reportedUserID), description })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not submit complaint.");
            }

            setMessage(data.message);
            setReportedUserID("");
            setDescription("");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1>Welcome {user.role === "student" ? "Student" : "Tutor"}!</h1>
                <h2>{user.fullName}</h2>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>

                <form onSubmit={submitComplaint} style={styles.complaintForm}>
                    <h3>Submit a Complaint</h3>
                    <p style={styles.hint}>Enter the user ID of the student or tutor you want to report.</p>
                    <input type="number" min="1" placeholder="Reported user ID" value={reportedUserID} onChange={(event) => setReportedUserID(event.target.value)} required />
                    <textarea placeholder="Describe the complaint" value={description} onChange={(event) => setDescription(event.target.value)} required />
                    <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Complaint"}</button>
                    {message && <p style={styles.success}>{message}</p>}
                    {error && <p style={styles.error}>{error}</p>}
                </form>

                <button onClick={onLogout}>Logout</button>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#111", color: "white", padding: "24px" },
    card: { width: "min(500px, 100%)", padding: "40px", background: "#1e1e1e", borderRadius: "12px", textAlign: "center" },
    complaintForm: { display: "flex", flexDirection: "column", gap: "10px", textAlign: "left", margin: "28px 0" },
    hint: { color: "#cbd5e1", margin: 0, fontSize: "14px" },
    success: { color: "#86efac", margin: 0 },
    error: { color: "#fca5a5", margin: 0 }
};

export default Dashboard;
