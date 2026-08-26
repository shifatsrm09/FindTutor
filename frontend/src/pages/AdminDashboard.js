import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000";

function AdminDashboard({ onLogout }) {
    const [overview, setOverview] = useState(null);
    const [users, setUsers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [matchType, setMatchType] = useState("tutors");
    const [requestID, setRequestID] = useState("");
    const [matches, setMatches] = useState([]);
    const [tutorRequests, setTutorRequests] = useState([]);
    const [studentRequests, setStudentRequests] = useState([]);

    const [activeTab, setActiveTab] = useState("overview");
    const [userSearch, setUserSearch] = useState("");
    const [complaintFilter, setComplaintFilter] = useState("ALL");

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
            const [
                overviewData,
                usersData,
                complaintsData,
                tutorRequestsData,
                studentRequestsData
            ] = await Promise.all([
                request("/api/admin/overview"),
                request("/api/admin/users"),
                request("/api/admin/complaints"),
                request("/api/admin/requests/tutors"),
                request("/api/admin/requests/students")
            ]);

            setOverview(overviewData.overview);
            setUsers(usersData.users || []);
            setComplaints(complaintsData.complaints || []);
            setTutorRequests(tutorRequestsData.requests || []);
            setStudentRequests(studentRequestsData.requests || []);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

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

            await loadAdminData();
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const resolveComplaint = async (complaintID) => {
        try {
            await request(`/api/admin/complaints/${complaintID}/resolve`, {
                method: "PATCH"
            });

            await loadAdminData();
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const findMatches = async (event) => {
        event.preventDefault();

        if (!requestID) {
            setError("Please enter a request ID.");
            return;
        }

        setError("");
        setMatches([]);

        try {
            const data = await request(
                `/api/admin/matches/${matchType}/${requestID}`
            );

            setMatches(data.matches || []);
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const students = useMemo(() => {
        return users
            .filter((user) => user.role?.toUpperCase() === "STUDENT")
            .filter((user) => {
                const search = userSearch.toLowerCase().trim();

                if (!search) return true;

                return (
                    String(user.fullName || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(user.email || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(user.userID || "")
                        .toLowerCase()
                        .includes(search)
                );
            });
    }, [users, userSearch]);

    const tutors = useMemo(() => {
        return users
            .filter((user) => {
                const role = String(user.role || "").toUpperCase();

                return role === "TUTOR" || role === "TEACHER";
            })
            .filter((user) => {
                const search = userSearch.toLowerCase().trim();

                if (!search) return true;

                return (
                    String(user.fullName || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(user.email || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(user.userID || "")
                        .toLowerCase()
                        .includes(search)
                );
            });
    }, [users, userSearch]);

    const filteredComplaints = useMemo(() => {
        if (complaintFilter === "ALL") {
            return complaints;
        }

        return complaints.filter(
            (complaint) =>
                String(complaint.status || "").toUpperCase() ===
                complaintFilter
        );
    }, [complaints, complaintFilter]);

    const openComplaints = complaints.filter(
        (complaint) =>
            String(complaint.status || "").toUpperCase() === "OPEN"
    ).length;

    const underReviewComplaints = complaints.filter(
        (complaint) =>
            String(complaint.status || "").toUpperCase() === "UNDER_REVIEW"
    ).length;

    const resolvedComplaints = complaints.filter(
        (complaint) => {
            const status = String(complaint.status || "").toUpperCase();

            return status === "RESOLVED" || status === "CLOSED";
        }
    ).length;

    const navigation = [
        {
            id: "overview",
            label: "Overview",
            icon: "▦"
        },
        {
            id: "students",
            label: "Students",
            icon: "🎓",
            count: students.length
        },
        {
            id: "tutors",
            label: "Tutors",
            icon: "👨‍🏫",
            count: tutors.length
        },
        {
            id: "complaints",
            label: "Complaints",
            icon: "⚠",
            count: openComplaints
        },
        {
            id: "studentRequests",
            label: "Student Requests",
            icon: "📚",
            count: tutorRequests.length
        },
        {
            id: "tutorRequests",
            label: "Tutor Requests",
            icon: "🧑‍🏫",
            count: studentRequests.length
        },
        {
            id: "matches",
            label: "Find Matches",
            icon: "🔎"
        }
    ];

    const currentNavigation = navigation.find(
        (item) => item.id === activeTab
    );

    return (
        <div style={styles.page}>
            <header style={styles.topbar}>
                <div style={styles.brandArea}>
                    <div style={styles.brandIcon}>FT</div>

                    <div>
                        <h1 style={styles.brandTitle}>Find Tutor</h1>
                        <p style={styles.brandSubtitle}>Administration Panel</p>
                    </div>
                </div>

                <div style={styles.topbarRight}>
                    <div style={styles.adminBadge}>
                        <span style={styles.onlineDot}></span>
                        Administrator
                    </div>

                    <button
                        onClick={onLogout}
                        style={styles.logoutButton}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div style={styles.layout}>
                <aside style={styles.sidebar}>
                    <div style={styles.sidebarHeading}>
                        ADMIN MENU
                    </div>

                    <nav style={styles.navigation}>
                        {navigation.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setError("");
                                    setMatches([]);
                                }}
                                style={{
                                    ...styles.navButton,
                                    ...(activeTab === item.id
                                        ? styles.navButtonActive
                                        : {})
                                }}
                            >
                                <span style={styles.navIcon}>
                                    {item.icon}
                                </span>

                                <span style={styles.navLabel}>
                                    {item.label}
                                </span>

                                {item.count !== undefined && (
                                    <span
                                        style={{
                                            ...styles.navCount,
                                            ...(activeTab === item.id
                                                ? styles.navCountActive
                                                : {})
                                        }}
                                    >
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div style={styles.sidebarFooter}>
                        <div style={styles.sidebarFooterTitle}>
                            Database
                        </div>

                        <div style={styles.sidebarFooterText}>
                            MySQL + Raw SQL
                        </div>

                        <div style={styles.sidebarFooterStatus}>
                            <span style={styles.statusDot}></span>
                            Connected
                        </div>
                    </div>
                </aside>

                <main style={styles.content}>
                    <div style={styles.contentHeader}>
                        <div>
                            <p style={styles.breadcrumb}>
                                Administration /{" "}
                                {currentNavigation?.label}
                            </p>

                            <h2 style={styles.pageTitle}>
                                {currentNavigation?.label}
                            </h2>
                        </div>

                        <button
                            onClick={loadAdminData}
                            style={styles.refreshButton}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {error && (
                        <div style={styles.errorBox}>
                            <span>⚠</span>
                            <span>{error}</span>

                            <button
                                onClick={() => setError("")}
                                style={styles.errorClose}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {loading || !overview ? (
                        <LoadingState />
                    ) : (
                        <>
                            {activeTab === "overview" && (
                                <OverviewSection
                                    overview={overview}
                                    students={students}
                                    tutors={tutors}
                                    complaints={complaints}
                                    tutorRequests={tutorRequests}
                                    studentRequests={studentRequests}
                                    setActiveTab={setActiveTab}
                                    openComplaints={openComplaints}
                                    underReviewComplaints={
                                        underReviewComplaints
                                    }
                                />
                            )}

                            {activeTab === "students" && (
                                <UserSection
                                    title="Students"
                                    description="Manage registered students and their account status."
                                    users={students}
                                    search={userSearch}
                                    setSearch={setUserSearch}
                                    changeBanStatus={changeBanStatus}
                                    emptyMessage="No students found."
                                    accent="student"
                                />
                            )}

                            {activeTab === "tutors" && (
                                <UserSection
                                    title="Tutors"
                                    description="Manage registered tutors and their account status."
                                    users={tutors}
                                    search={userSearch}
                                    setSearch={setUserSearch}
                                    changeBanStatus={changeBanStatus}
                                    emptyMessage="No tutors found."
                                    accent="tutor"
                                />
                            )}

                            {activeTab === "complaints" && (
                                <ComplaintsSection
                                    complaints={filteredComplaints}
                                    complaintFilter={complaintFilter}
                                    setComplaintFilter={setComplaintFilter}
                                    resolveComplaint={resolveComplaint}
                                    total={complaints.length}
                                    open={openComplaints}
                                    underReview={underReviewComplaints}
                                    resolved={resolvedComplaints}
                                />
                            )}

                            {activeTab === "studentRequests" && (
                                <RequestsSection
                                    title="Student Requests"
                                    description="Students can submit requests when they need a tutor for a subject, schedule, budget, or teaching mode."
                                    rows={tutorRequests}
                                    emptyMessage="No student tutor requests found."
                                    type="student"
                                />
                            )}

                            {activeTab === "tutorRequests" && (
                                <RequestsSection
                                    title="Tutor Requests"
                                    description="Tutors can submit requests when they are looking for students matching their subject and schedule."
                                    rows={studentRequests}
                                    emptyMessage="No tutor requests found."
                                    type="tutor"
                                />
                            )}

                            {activeTab === "matches" && (
                                <MatchSection
                                    matchType={matchType}
                                    setMatchType={setMatchType}
                                    requestID={requestID}
                                    setRequestID={setRequestID}
                                    findMatches={findMatches}
                                    matches={matches}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

function OverviewSection({
    overview,
    students,
    tutors,
    complaints,
    tutorRequests,
    studentRequests,
    setActiveTab,
    openComplaints,
    underReviewComplaints
}) {
    return (
        <div>
            <div style={styles.statsGrid}>
                <StatCard
                    icon="🎓"
                    label="Students"
                    value={overview.totalStudents ?? students.length}
                    description="Registered student accounts"
                    onClick={() => setActiveTab("students")}
                />

                <StatCard
                    icon="👨‍🏫"
                    label="Tutors"
                    value={overview.totalTutors ?? tutors.length}
                    description="Registered tutor accounts"
                    onClick={() => setActiveTab("tutors")}
                />

                <StatCard
                    icon="🔒"
                    label="Banned Users"
                    value={overview.bannedUsers ?? 0}
                    description="Currently restricted accounts"
                    onClick={() => setActiveTab("students")}
                />

                <StatCard
                    icon="⚠"
                    label="Open Complaints"
                    value={overview.openComplaints ?? openComplaints}
                    description="Complaints requiring attention"
                    onClick={() => setActiveTab("complaints")}
                    warning
                />
            </div>

            <div style={styles.overviewGrid}>
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                        <div>
                            <h3 style={styles.panelTitle}>
                                Platform Activity
                            </h3>

                            <p style={styles.panelSubtitle}>
                                Quick overview of administrative items.
                            </p>
                        </div>
                    </div>

                    <div style={styles.activityList}>
                        <ActivityRow
                            label="Student tutor requests"
                            value={tutorRequests.length}
                            icon="📚"
                            onClick={() =>
                                setActiveTab("studentRequests")
                            }
                        />

                        <ActivityRow
                            label="Tutor requests"
                            value={studentRequests.length}
                            icon="🧑‍🏫"
                            onClick={() =>
                                setActiveTab("tutorRequests")
                            }
                        />

                        <ActivityRow
                            label="Open complaints"
                            value={openComplaints}
                            icon="⚠"
                            onClick={() =>
                                setActiveTab("complaints")
                            }
                        />

                        <ActivityRow
                            label="Complaints under review"
                            value={underReviewComplaints}
                            icon="🔍"
                            onClick={() =>
                                setActiveTab("complaints")
                            }
                        />

                        <ActivityRow
                            label="Total complaints"
                            value={complaints.length}
                            icon="📋"
                            onClick={() =>
                                setActiveTab("complaints")
                            }
                        />
                    </div>
                </div>

                <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                        <div>
                            <h3 style={styles.panelTitle}>
                                Quick Actions
                            </h3>

                            <p style={styles.panelSubtitle}>
                                Jump directly to an administrative task.
                            </p>
                        </div>
                    </div>

                    <div style={styles.quickActions}>
                        <QuickAction
                            icon="🎓"
                            title="Manage Students"
                            description="View, search and ban/unban students."
                            onClick={() => setActiveTab("students")}
                        />

                        <QuickAction
                            icon="👨‍🏫"
                            title="Manage Tutors"
                            description="View and manage tutor accounts."
                            onClick={() => setActiveTab("tutors")}
                        />

                        <QuickAction
                            icon="⚠"
                            title="Review Complaints"
                            description="Inspect and resolve user complaints."
                            onClick={() => setActiveTab("complaints")}
                        />

                        <QuickAction
                            icon="🔎"
                            title="Find Request Matches"
                            description="Find matching tutors or students."
                            onClick={() => setActiveTab("matches")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserSection({
    title,
    description,
    users,
    search,
    setSearch,
    changeBanStatus,
    emptyMessage,
    accent
}) {
    return (
        <section style={styles.panel}>
            <div style={styles.sectionHeader}>
                <div>
                    <div style={styles.sectionTitleRow}>
                        <h3 style={styles.sectionTitle}>{title}</h3>

                        <span
                            style={{
                                ...styles.roleBadge,
                                ...(accent === "student"
                                    ? styles.studentBadge
                                    : styles.tutorBadge)
                            }}
                        >
                            {users.length} accounts
                        </span>
                    </div>

                    <p style={styles.sectionDescription}>
                        {description}
                    </p>
                </div>

                <div style={styles.searchBox}>
                    <span style={styles.searchIcon}>⌕</span>

                    <input
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder={`Search ${title.toLowerCase()}...`}
                        style={styles.searchInput}
                    />

                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            style={styles.clearSearch}
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            <div style={styles.tableContainer}>
                {users.length === 0 ? (
                    <EmptyState message={emptyMessage} />
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>User</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user) => (
                                <tr key={user.userID}>
                                    <td style={styles.td}>
                                        <span style={styles.idBadge}>
                                            #{user.userID}
                                        </span>
                                    </td>

                                    <td style={styles.td}>
                                        <div style={styles.userCell}>
                                            <div
                                                style={{
                                                    ...styles.avatar,
                                                    ...(accent ===
                                                    "student"
                                                        ? styles.studentAvatar
                                                        : styles.tutorAvatar)
                                                }}
                                            >
                                                {getInitials(
                                                    user.fullName
                                                )}
                                            </div>

                                            <div>
                                                <strong
                                                    style={
                                                        styles.userName
                                                    }
                                                >
                                                    {user.fullName}
                                                </strong>

                                                {user.location && (
                                                    <span
                                                        style={
                                                            styles.userMeta
                                                        }
                                                    >
                                                        {user.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        <span
                                            style={styles.emailText}
                                        >
                                            {user.email}
                                        </span>
                                    </td>

                                    <td style={styles.td}>
                                        <span
                                            style={{
                                                ...styles.roleBadge,
                                                ...(accent ===
                                                "student"
                                                    ? styles.studentBadge
                                                    : styles.tutorBadge)
                                            }}
                                        >
                                            {user.role}
                                        </span>
                                    </td>

                                    <td style={styles.td}>
                                        <StatusBadge
                                            banned={Boolean(
                                                user.isBanned
                                            )}
                                        />
                                    </td>

                                    <td style={styles.td}>
                                        <button
                                            onClick={() =>
                                                changeBanStatus(
                                                    user.userID,
                                                    !user.isBanned
                                                )
                                            }
                                            style={{
                                                ...styles.actionButton,
                                                ...(user.isBanned
                                                    ? styles.unbanButton
                                                    : styles.banButton)
                                            }}
                                        >
                                            {user.isBanned
                                                ? "Unban"
                                                : "Ban User"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

function ComplaintsSection({
    complaints,
    complaintFilter,
    setComplaintFilter,
    resolveComplaint,
    total,
    open,
    underReview,
    resolved
}) {
    return (
        <div>
            <div style={styles.statsGrid}>
                <MiniStat
                    label="Total"
                    value={total}
                    icon="📋"
                />

                <MiniStat
                    label="Open"
                    value={open}
                    icon="⚠"
                    warning
                />

                <MiniStat
                    label="Under Review"
                    value={underReview}
                    icon="🔍"
                />

                <MiniStat
                    label="Resolved / Closed"
                    value={resolved}
                    icon="✓"
                />
            </div>

            <section style={styles.panel}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h3 style={styles.sectionTitle}>
                            Complaints
                        </h3>

                        <p style={styles.sectionDescription}>
                            Review reports between students, tutors,
                            and other platform users.
                        </p>
                    </div>

                    <div style={styles.filterGroup}>
                        {[
                            ["ALL", "All"],
                            ["OPEN", "Open"],
                            ["UNDER_REVIEW", "Under Review"],
                            ["RESOLVED", "Resolved"],
                            ["CLOSED", "Closed"]
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                onClick={() =>
                                    setComplaintFilter(value)
                                }
                                style={{
                                    ...styles.filterButton,
                                    ...(complaintFilter === value
                                        ? styles.filterButtonActive
                                        : {})
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {complaints.length === 0 ? (
                    <EmptyState message="No complaints match this filter." />
                ) : (
                    <div style={styles.complaintList}>
                        {complaints.map((complaint) => (
                            <article
                                key={complaint.complaintID}
                                style={styles.complaintCard}
                            >
                                <div
                                    style={
                                        styles.complaintMain
                                    }
                                >
                                    <div
                                        style={
                                            styles.complaintTop
                                        }
                                    >
                                        <span
                                            style={
                                                styles.complaintId
                                            }
                                        >
                                            Complaint #
                                            {
                                                complaint.complaintID
                                            }
                                        </span>

                                        <ComplaintStatus
                                            status={
                                                complaint.status
                                            }
                                        />

                                        <span
                                            style={
                                                styles.dateText
                                            }
                                        >
                                            {formatDate(
                                                complaint.createdAt
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.reportParties
                                        }
                                    >
                                        <strong>
                                            {
                                                complaint.reporterName
                                            }
                                        </strong>

                                        <span
                                            style={
                                                styles.reportArrow
                                            }
                                        >
                                            →
                                        </span>

                                        <strong>
                                            {
                                                complaint.reportedName
                                            }
                                        </strong>
                                    </div>

                                    <p
                                        style={
                                            styles.complaintDescription
                                        }
                                    >
                                        {
                                            complaint.description
                                        }
                                    </p>
                                </div>

                                {String(
                                    complaint.status || ""
                                ).toUpperCase() === "OPEN" && (
                                    <button
                                        onClick={() =>
                                            resolveComplaint(
                                                complaint.complaintID
                                            )
                                        }
                                        style={
                                            styles.resolveButton
                                        }
                                    >
                                        ✓ Resolve
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function RequestsSection({
    title,
    description,
    rows,
    emptyMessage,
    type
}) {
    return (
        <section style={styles.panel}>
            <div style={styles.sectionHeader}>
                <div>
                    <div style={styles.sectionTitleRow}>
                        <h3 style={styles.sectionTitle}>
                            {title}
                        </h3>

                        <span
                            style={{
                                ...styles.roleBadge,
                                ...(type === "student"
                                    ? styles.studentBadge
                                    : styles.tutorBadge)
                            }}
                        >
                            {rows.length} requests
                        </span>
                    </div>

                    <p style={styles.sectionDescription}>
                        {description}
                    </p>
                </div>
            </div>

            <RequestTable
                rows={rows}
                emptyMessage={emptyMessage}
            />
        </section>
    );
}

function MatchSection({
    matchType,
    setMatchType,
    requestID,
    setRequestID,
    findMatches,
    matches
}) {
    const findingTutors = matchType === "tutors";

    return (
        <div>
            <section style={styles.matchHero}>
                <div style={styles.matchHeroIcon}>🔎</div>

                <div>
                    <h3 style={styles.matchHeroTitle}>
                        Find Request Matches
                    </h3>

                    <p style={styles.matchHeroDescription}>
                        Use a request ID to find compatible users
                        based on subject, budget, teaching mode,
                        and schedule.
                    </p>
                </div>
            </section>

            <section style={styles.panel}>
                <div style={styles.matchInstruction}>
                    <div style={styles.instructionIcon}>
                        {findingTutors ? "🎓" : "👨‍🏫"}
                    </div>

                    <div>
                        <strong>
                            {findingTutors
                                ? "Find tutors for a student request"
                                : "Find students for a tutor request"}
                        </strong>

                        <p>
                            {findingTutors
                                ? "Enter a student tutor-request ID and the system will find suitable tutors."
                                : "Enter a tutor-request ID and the system will find suitable students."}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={findMatches}
                    style={styles.matchForm}
                >
                    <div style={styles.formField}>
                        <label style={styles.formLabel}>
                            Match Direction
                        </label>

                        <select
                            value={matchType}
                            onChange={(event) => {
                                setMatchType(
                                    event.target.value
                                );
                            }}
                            style={styles.formInput}
                        >
                            <option value="tutors">
                                Student Request → Find Tutors
                            </option>

                            <option value="students">
                                Tutor Request → Find Students
                            </option>
                        </select>
                    </div>

                    <div style={styles.formField}>
                        <label style={styles.formLabel}>
                            Request ID
                        </label>

                        <input
                            type="number"
                            min="1"
                            placeholder="e.g. 12"
                            value={requestID}
                            onChange={(event) =>
                                setRequestID(
                                    event.target.value
                                )
                            }
                            required
                            style={styles.formInput}
                        />
                    </div>

                    <button
                        type="submit"
                        style={styles.findButton}
                    >
                        🔎 Find Matches
                    </button>
                </form>
            </section>

            <section style={styles.panel}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h3 style={styles.sectionTitle}>
                            Match Results
                        </h3>

                        <p style={styles.sectionDescription}>
                            {requestID
                                ? `Results for request #${requestID}`
                                : "Search for a request to display matching users."}
                        </p>
                    </div>

                    {matches.length > 0 && (
                        <span style={styles.resultCount}>
                            {matches.length} matches
                        </span>
                    )}
                </div>

                {matches.length > 0 ? (
                    <DynamicTable rows={matches} />
                ) : (
                    <EmptyState
                        message={
                            requestID
                                ? "No matches found for this request yet."
                                : "No match search has been performed."
                        }
                    />
                )}
            </section>
        </div>
    );
}

function RequestTable({ rows, emptyMessage }) {
    if (!rows.length) {
        return (
            <EmptyState
                message={emptyMessage || "No requests found."}
            />
        );
    }

    const keys = Object.keys(rows[0]);

    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        {keys.map((key) => (
                            <th key={key} style={styles.th}>
                                {formatColumnName(key)}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, index) => (
                        <tr
                            key={
                                row.requestID ||
                                row.studentRequestID ||
                                row.tutorRequestID ||
                                index
                            }
                        >
                            {keys.map((key) => (
                                <td
                                    key={key}
                                    style={styles.td}
                                >
                                    {formatCellValue(
                                        row[key]
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DynamicTable({ rows }) {
    if (!rows.length) return null;

    const keys = Object.keys(rows[0]);

    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        {keys.map((key) => (
                            <th key={key} style={styles.th}>
                                {formatColumnName(key)}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {keys.map((key) => (
                                <td
                                    key={key}
                                    style={styles.td}
                                >
                                    {formatCellValue(
                                        row[key]
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    description,
    onClick,
    warning
}) {
    return (
        <button
            onClick={onClick}
            style={{
                ...styles.statCard,
                ...(warning
                    ? styles.statCardWarning
                    : {})
            }}
        >
            <div style={styles.statTop}>
                <div style={styles.statIcon}>{icon}</div>

                <span style={styles.statArrow}>→</span>
            </div>

            <div style={styles.statValue}>{value}</div>

            <div style={styles.statLabel}>{label}</div>

            <div style={styles.statDescription}>
                {description}
            </div>
        </button>
    );
}

function MiniStat({ label, value, icon, warning }) {
    return (
        <div
            style={{
                ...styles.miniStat,
                ...(warning ? styles.miniStatWarning : {})
            }}
        >
            <div style={styles.miniStatIcon}>{icon}</div>

            <div>
                <div style={styles.miniStatValue}>{value}</div>
                <div style={styles.miniStatLabel}>{label}</div>
            </div>
        </div>
    );
}

function ActivityRow({ label, value, icon, onClick }) {
    return (
        <button
            onClick={onClick}
            style={styles.activityRow}
        >
            <div style={styles.activityLeft}>
                <span style={styles.activityIcon}>{icon}</span>

                <span style={styles.activityLabel}>
                    {label}
                </span>
            </div>

            <div style={styles.activityRight}>
                <strong>{value}</strong>
                <span>→</span>
            </div>
        </button>
    );
}

function QuickAction({
    icon,
    title,
    description,
    onClick
}) {
    return (
        <button
            onClick={onClick}
            style={styles.quickAction}
        >
            <div style={styles.quickActionIcon}>
                {icon}
            </div>

            <div style={styles.quickActionText}>
                <strong>{title}</strong>
                <span>{description}</span>
            </div>

            <span style={styles.quickActionArrow}>→</span>
        </button>
    );
}

function StatusBadge({ banned }) {
    return (
        <span
            style={{
                ...styles.statusBadge,
                ...(banned
                    ? styles.statusBanned
                    : styles.statusActive)
            }}
        >
            <span
                style={{
                    ...styles.statusSmallDot,
                    background: banned
                        ? "#ef4444"
                        : "#22c55e"
                }}
            ></span>

            {banned ? "Banned" : "Active"}
        </span>
    );
}

function ComplaintStatus({ status }) {
    const normalized = String(status || "").toUpperCase();

    let style = styles.complaintOpen;

    if (normalized === "UNDER_REVIEW") {
        style = styles.complaintReview;
    } else if (
        normalized === "RESOLVED" ||
        normalized === "CLOSED"
    ) {
        style = styles.complaintResolved;
    }

    return (
        <span
            style={{
                ...styles.complaintStatus,
                ...style
            }}
        >
            {String(status || "UNKNOWN").replace("_", " ")}
        </span>
    );
}

function EmptyState({ message }) {
    return (
        <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⌁</div>

            <strong>No data</strong>

            <span>{message}</span>
        </div>
    );
}

function LoadingState() {
    return (
        <div style={styles.loadingState}>
            <div style={styles.loadingSpinner}></div>

            <strong>Loading administrator data...</strong>

            <span>
                Fetching users, complaints and requests.
            </span>
        </div>
    );
}

function getInitials(name) {
    if (!name) return "U";

    return name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}

function formatColumnName(value) {
    return String(value)
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (character) =>
            character.toUpperCase()
        )
        .trim();
}

function formatCellValue(value) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    if (
        typeof value === "boolean" ||
        value === 0 ||
        value === 1
    ) {
        if (
            value === true ||
            value === false
        ) {
            return value ? "Yes" : "No";
        }
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f4f7fb",
        color: "#172033",
        fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
    },

    topbar: {
        height: "72px",
        background: "#ffffff",
        borderBottom: "1px solid #e5eaf1",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 100
    },

    brandArea: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },

    brandIcon: {
        width: "42px",
        height: "42px",
        borderRadius: "11px",
        background: "#2563eb",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: 800,
        letterSpacing: "-0.5px"
    },

    brandTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 800,
        color: "#172033"
    },

    brandSubtitle: {
        margin: "2px 0 0",
        fontSize: "12px",
        color: "#718096"
    },

    topbarRight: {
        display: "flex",
        alignItems: "center",
        gap: "16px"
    },

    adminBadge: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "13px",
        color: "#536174",
        fontWeight: 600
    },

    onlineDot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#22c55e"
    },

    logoutButton: {
        border: "1px solid #dbe2ea",
        background: "#ffffff",
        color: "#334155",
        borderRadius: "8px",
        padding: "9px 15px",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer"
    },

    layout: {
        display: "flex",
        minHeight: "calc(100vh - 72px)"
    },

    sidebar: {
        width: "245px",
        flexShrink: 0,
        background: "#ffffff",
        borderRight: "1px solid #e5eaf1",
        padding: "24px 14px",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: "72px",
        height: "calc(100vh - 72px)",
        boxSizing: "border-box"
    },

    sidebarHeading: {
        fontSize: "10px",
        fontWeight: 800,
        color: "#9aa5b5",
        letterSpacing: "1.2px",
        padding: "0 12px 10px"
    },

    navigation: {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },

    navButton: {
        width: "100%",
        minHeight: "44px",
        border: "0",
        background: "transparent",
        color: "#5d6878",
        borderRadius: "9px",
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: "10px 12px",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "13px",
        fontWeight: 600
    },

    navButtonActive: {
        background: "#eff6ff",
        color: "#2563eb"
    },

    navIcon: {
        width: "22px",
        textAlign: "center",
        fontSize: "15px"
    },

    navLabel: {
        flex: 1
    },

    navCount: {
        minWidth: "22px",
        height: "22px",
        padding: "0 6px",
        boxSizing: "border-box",
        borderRadius: "11px",
        background: "#f1f4f8",
        color: "#657184",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: 800
    },

    navCountActive: {
        background: "#dbeafe",
        color: "#2563eb"
    },

    sidebarFooter: {
        marginTop: "auto",
        padding: "16px 12px",
        borderTop: "1px solid #edf0f4"
    },

    sidebarFooterTitle: {
        fontSize: "12px",
        fontWeight: 700,
        color: "#475569",
        marginBottom: "4px"
    },

    sidebarFooterText: {
        fontSize: "11px",
        color: "#8a95a5",
        marginBottom: "9px"
    },

    sidebarFooterStatus: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "#16a34a",
        fontSize: "11px",
        fontWeight: 700
    },

    statusDot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#22c55e"
    },

    content: {
        flex: 1,
        minWidth: 0,
        padding: "30px",
        maxWidth: "1500px",
        boxSizing: "border-box"
    },

    contentHeader: {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "24px"
    },

    breadcrumb: {
        margin: "0 0 5px",
        color: "#94a0b1",
        fontSize: "11px",
        fontWeight: 600
    },

    pageTitle: {
        margin: 0,
        fontSize: "27px",
        lineHeight: 1.2,
        color: "#172033",
        fontWeight: 800,
        letterSpacing: "-0.5px"
    },

    refreshButton: {
        border: "1px solid #dbe2ea",
        background: "#ffffff",
        color: "#475569",
        borderRadius: "8px",
        padding: "9px 14px",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer"
    },

    errorBox: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        color: "#be123c",
        borderRadius: "10px",
        padding: "12px 14px",
        marginBottom: "20px",
        fontSize: "13px"
    },

    errorClose: {
        marginLeft: "auto",
        border: 0,
        background: "transparent",
        color: "#be123c",
        cursor: "pointer",
        fontSize: "18px"
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "15px",
        marginBottom: "20px"
    },

    statCard: {
        border: "1px solid #e3e8ef",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "18px",
        textAlign: "left",
        cursor: "pointer",
        color: "#172033",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)"
    },

    statCardWarning: {
        borderColor: "#fed7aa",
        background: "#fffdf8"
    },

    statTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    },

    statIcon: {
        width: "36px",
        height: "36px",
        borderRadius: "9px",
        background: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px"
    },

    statArrow: {
        color: "#a0aaba",
        fontSize: "16px"
    },

    statValue: {
        marginTop: "16px",
        fontSize: "27px",
        lineHeight: 1,
        fontWeight: 800,
        color: "#172033"
    },

    statLabel: {
        marginTop: "7px",
        fontSize: "13px",
        fontWeight: 700,
        color: "#4b586a"
    },

    statDescription: {
        marginTop: "5px",
        fontSize: "11px",
        color: "#8a95a5"
    },

    overviewGrid: {
        display: "grid",
        gridTemplateColumns:
            "minmax(0, 1.1fr) minmax(0, 0.9fr)",
        gap: "20px"
    },

    panel: {
        background: "#ffffff",
        border: "1px solid #e3e8ef",
        borderRadius: "12px",
        padding: "22px",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
        marginBottom: "20px",
        minWidth: 0
    },

    panelHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "18px"
    },

    panelTitle: {
        margin: 0,
        fontSize: "15px",
        color: "#1e293b",
        fontWeight: 800
    },

    panelSubtitle: {
        margin: "5px 0 0",
        fontSize: "12px",
        color: "#8a95a5"
    },

    activityList: {
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid #edf0f4"
    },

    activityRow: {
        width: "100%",
        border: 0,
        borderBottom: "1px solid #edf0f4",
        background: "#ffffff",
        padding: "14px 2px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        textAlign: "left"
    },

    activityLeft: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },

    activityIcon: {
        width: "30px",
        height: "30px",
        background: "#f6f8fb",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px"
    },

    activityLabel: {
        fontSize: "12px",
        color: "#526071",
        fontWeight: 600
    },

    activityRight: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#2563eb",
        fontSize: "12px"
    },

    quickActions: {
        display: "grid",
        gap: "9px"
    },

    quickAction: {
        display: "flex",
        alignItems: "center",
        gap: "11px",
        width: "100%",
        border: "1px solid #edf0f4",
        background: "#fbfcfe",
        borderRadius: "9px",
        padding: "12px",
        cursor: "pointer",
        textAlign: "left"
    },

    quickActionIcon: {
        width: "34px",
        height: "34px",
        borderRadius: "8px",
        background: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },

    quickActionText: {
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        flex: 1
    },

    quickActionTextStrong: {
        fontSize: "12px"
    },

    quickActionArrow: {
        color: "#9aa5b5",
        fontSize: "15px"
    },

    sectionHeader: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "20px",
        flexWrap: "wrap"
    },

    sectionTitleRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap"
    },

    sectionTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 800,
        color: "#172033"
    },

    sectionDescription: {
        margin: "6px 0 0",
        fontSize: "12px",
        color: "#7b8798",
        lineHeight: 1.5
    },

    roleBadge: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        padding: "4px 8px",
        fontSize: "10px",
        fontWeight: 800,
        whiteSpace: "nowrap"
    },

    studentBadge: {
        background: "#eff6ff",
        color: "#2563eb"
    },

    tutorBadge: {
        background: "#f5f3ff",
        color: "#7c3aed"
    },

    searchBox: {
        minWidth: "240px",
        height: "38px",
        border: "1px solid #dce3eb",
        borderRadius: "8px",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        boxSizing: "border-box"
    },

    searchIcon: {
        color: "#9aa5b5",
        fontSize: "19px",
        marginRight: "7px"
    },

    searchInput: {
        border: 0,
        outline: 0,
        width: "100%",
        fontSize: "12px",
        color: "#334155",
        background: "transparent"
    },

    clearSearch: {
        border: 0,
        background: "transparent",
        color: "#94a0b1",
        fontSize: "17px",
        cursor: "pointer"
    },

    tableContainer: {
        width: "100%",
        overflowX: "auto",
        border: "1px solid #e8edf3",
        borderRadius: "9px"
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left",
        minWidth: "700px"
    },

    th: {
        background: "#f8fafc",
        color: "#687587",
        fontSize: "10px",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        padding: "12px 13px",
        borderBottom: "1px solid #e5eaf1",
        whiteSpace: "nowrap"
    },

    td: {
        padding: "12px 13px",
        borderBottom: "1px solid #edf0f4",
        fontSize: "12px",
        color: "#526071",
        verticalAlign: "middle"
    },

    userCell: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        minWidth: "170px"
    },

    avatar: {
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: 800,
        flexShrink: 0
    },

    studentAvatar: {
        background: "#dbeafe",
        color: "#2563eb"
    },

    tutorAvatar: {
        background: "#ede9fe",
        color: "#7c3aed"
    },

    userName: {
        display: "block",
        color: "#253044",
        fontSize: "12px",
        lineHeight: 1.3
    },

    userMeta: {
        display: "block",
        color: "#9aa5b5",
        fontSize: "10px",
        marginTop: "2px"
    },

    emailText: {
        color: "#667386",
        whiteSpace: "nowrap"
    },

    idBadge: {
        color: "#718096",
        fontSize: "11px",
        fontWeight: 700
    },

    statusBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 8px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: 800
    },

    statusActive: {
        background: "#ecfdf5",
        color: "#15803d"
    },

    statusBanned: {
        background: "#fef2f2",
        color: "#dc2626"
    },

    statusSmallDot: {
        width: "5px",
        height: "5px",
        borderRadius: "50%"
    },

    actionButton: {
        borderRadius: "7px",
        padding: "7px 10px",
        fontSize: "10px",
        fontWeight: 800,
        cursor: "pointer"
    },

    banButton: {
        border: "1px solid #fecaca",
        background: "#fff7f7",
        color: "#dc2626"
    },

    unbanButton: {
        border: "1px solid #bbf7d0",
        background: "#f0fdf4",
        color: "#15803d"
    },

    miniStat: {
        display: "flex",
        alignItems: "center",
        gap: "11px",
        background: "#ffffff",
        border: "1px solid #e3e8ef",
        borderRadius: "10px",
        padding: "14px 16px"
    },

    miniStatWarning: {
        background: "#fffdf8",
        borderColor: "#fed7aa"
    },

    miniStatIcon: {
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: "#f4f7fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },

    miniStatValue: {
        fontSize: "18px",
        lineHeight: 1,
        fontWeight: 800,
        color: "#1e293b"
    },

    miniStatLabel: {
        marginTop: "4px",
        fontSize: "10px",
        color: "#7b8798",
        fontWeight: 600
    },

    filterGroup: {
        display: "flex",
        gap: "5px",
        flexWrap: "wrap"
    },

    filterButton: {
        border: "1px solid #dce3eb",
        background: "#ffffff",
        color: "#64748b",
        borderRadius: "7px",
        padding: "7px 10px",
        fontSize: "10px",
        fontWeight: 700,
        cursor: "pointer"
    },

    filterButtonActive: {
        background: "#eff6ff",
        color: "#2563eb",
        borderColor: "#bfdbfe"
    },

    complaintList: {
        display: "flex",
        flexDirection: "column",
        gap: "9px"
    },

    complaintCard: {
        border: "1px solid #e5eaf1",
        borderRadius: "9px",
        padding: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        background: "#ffffff"
    },

    complaintMain: {
        minWidth: 0,
        flex: 1
    },

    complaintTop: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap"
    },

    complaintId: {
        fontSize: "10px",
        color: "#8a95a5",
        fontWeight: 800
    },

    complaintStatus: {
        borderRadius: "999px",
        padding: "4px 7px",
        fontSize: "9px",
        fontWeight: 800,
        textTransform: "uppercase"
    },

    complaintOpen: {
        background: "#fff1f2",
        color: "#e11d48"
    },

    complaintReview: {
        background: "#fff7ed",
        color: "#c2410c"
    },

    complaintResolved: {
        background: "#ecfdf5",
        color: "#15803d"
    },

    dateText: {
        fontSize: "10px",
        color: "#9aa5b5"
    },

    reportParties: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "10px",
        color: "#334155",
        fontSize: "12px"
    },

    reportArrow: {
        color: "#94a3b8"
    },

    complaintDescription: {
        margin: "7px 0 0",
        color: "#657184",
        fontSize: "12px",
        lineHeight: 1.5
    },

    resolveButton: {
        flexShrink: 0,
        border: "1px solid #bbf7d0",
        background: "#f0fdf4",
        color: "#15803d",
        borderRadius: "7px",
        padding: "8px 11px",
        fontSize: "10px",
        fontWeight: 800,
        cursor: "pointer"
    },

    matchHero: {
        background:
            "linear-gradient(135deg, #eff6ff 0%, #f8faff 100%)",
        border: "1px solid #dbeafe",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px"
    },

    matchHeroIcon: {
        width: "46px",
        height: "46px",
        borderRadius: "11px",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "21px",
        boxShadow: "0 1px 3px rgba(37, 99, 235, 0.08)"
    },

    matchHeroTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 800,
        color: "#1e3a8a"
    },

    matchHeroDescription: {
        margin: "5px 0 0",
        color: "#64748b",
        fontSize: "12px",
        lineHeight: 1.5
    },

    matchInstruction: {
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        background: "#f8fafc",
        borderRadius: "9px",
        padding: "13px",
        marginBottom: "18px"
    },

    instructionIcon: {
        width: "34px",
        height: "34px",
        borderRadius: "8px",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },

    matchForm: {
        display: "grid",
        gridTemplateColumns:
            "minmax(220px, 1fr) minmax(150px, 220px) auto",
        alignItems: "end",
        gap: "12px"
    },

    formField: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },

    formLabel: {
        fontSize: "10px",
        fontWeight: 800,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.4px"
    },

    formInput: {
        width: "100%",
        height: "40px",
        boxSizing: "border-box",
        border: "1px solid #dce3eb",
        borderRadius: "8px",
        background: "#ffffff",
        padding: "0 11px",
        outline: "none",
        fontSize: "12px",
        color: "#334155"
    },

    findButton: {
        height: "40px",
        border: 0,
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        padding: "0 17px",
        fontSize: "12px",
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap"
    },

    resultCount: {
        background: "#eff6ff",
        color: "#2563eb",
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "10px",
        fontWeight: 800
    },

    emptyState: {
        minHeight: "160px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        color: "#7b8798",
        fontSize: "12px",
        textAlign: "center"
    },

    emptyIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#f5f7fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#a0aaba",
        fontSize: "20px",
        marginBottom: "4px"
    },

    loadingState: {
        minHeight: "400px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        color: "#64748b",
        fontSize: "12px"
    },

    loadingSpinner: {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        border: "3px solid #dbeafe",
        borderTopColor: "#2563eb",
        marginBottom: "7px"
    }
};

export default AdminDashboard;