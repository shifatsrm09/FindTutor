import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

function AdminDashboard({ onLogout }) {

    const [overview, setOverview] = useState(null);
    const [users, setUsers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const request = async (path, options = {}) => {
        const token = localStorage.getItem("findTutorToken");
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }

        return data;
    };

    const loadAdminData = async () => {
        setLoading(true);
        setError("");

        try {
            const [overviewData, usersData, complaintsData] = await Promise.all([
                request("/api/admin/overview"),
                request("/api/admin/users"),
                request("/api/admin/complaints")
            ]);

            setOverview(overviewData.overview);
            setUsers(usersData.users);
            setComplaints(complaintsData.complaints);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    // Data is loaded once when the administrator dashboard opens.
    useEffect(() => {
        loadAdminData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const changeBanStatus = async (userID, isBanned) => {
        try {
            await request(`/api/admin/users/${userID}/ban`, {
                method: "PATCH",
                body: JSON.stringify({ isBanned })
            });
            loadAdminData();
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const resolveComplaint = async (complaintID) => {
        try {
            await request(`/api/admin/complaints/${complaintID}/resolve`, {
                method: "PATCH"
            });
            loadAdminData();
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    return (
        <div style={styles.page}>
            <main style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Admin Dashboard</h1>
                        <p style={styles.subtitle}>Manage accounts and review platform complaints.</p>
                    </div>
                    <button onClick={onLogout}>Logout</button>
                </header>

                {error && <p style={styles.error}>{error}</p>}

                {loading || !overview ? (
                    <p>Loading administrator data...</p>
                ) : (
                    <>
                        <section style={styles.stats}>
                            <StatCard label="Students" value={overview.totalStudents} />
                            <StatCard label="Tutors" value={overview.totalTutors} />
                            <StatCard label="Banned users" value={overview.bannedUsers} />
                            <StatCard label="Open complaints" value={overview.openComplaints} />
                        </section>

                        <section style={styles.section}>
                            <h2>Users</h2>
                            <div style={styles.tableWrap}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.userID}>
                                                <td>{user.fullName}</td>
                                                <td>{user.email}</td>
                                                <td>{user.role}</td>
                                                <td>{user.isBanned ? "Banned" : "Active"}</td>
                                                <td><button onClick={() => changeBanStatus(user.userID, !user.isBanned)}>{user.isBanned ? "Unban" : "Ban"}</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section style={styles.section}>
                            <h2>Complaints</h2>
                            {complaints.length === 0 ? <p>No complaints have been submitted.</p> : (
                                <div style={styles.complaints}>
                                    {complaints.map((complaint) => (
                                        <article key={complaint.complaintID} style={styles.complaint}>
                                            <div>
                                                <strong>{complaint.reporterName}</strong> reported <strong>{complaint.reportedName}</strong>
                                                <p style={styles.description}>{complaint.description}</p>
                                                <small>Status: {complaint.status} | {new Date(complaint.createdAt).toLocaleString()}</small>
                                            </div>
                                            {complaint.status === "OPEN" && <button onClick={() => resolveComplaint(complaint.complaintID)}>Resolve</button>}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

function StatCard({ label, value }) {
    return <div style={styles.statCard}><span>{label}</span><strong>{value}</strong></div>;
}

const styles = {
    page: { minHeight: "100vh", background: "#111", color: "white", padding: "32px" },
    container: { maxWidth: "1100px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "28px" },
    title: { margin: 0 }, subtitle: { color: "#cbd5e1", marginBottom: 0 },
    error: { color: "#fca5a5", background: "#450a0a", padding: "12px", borderRadius: "8px" },
    stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" },
    statCard: { display: "flex", flexDirection: "column", gap: "8px", padding: "20px", background: "#1e1e1e", borderRadius: "12px" },
    section: { background: "#1e1e1e", padding: "24px", borderRadius: "12px", marginBottom: "24px" },
    tableWrap: { overflowX: "auto" }, table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
    complaints: { display: "grid", gap: "12px" }, complaint: { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", padding: "16px", background: "#292929", borderRadius: "8px" },
    description: { margin: "8px 0" }
};

export default AdminDashboard;
