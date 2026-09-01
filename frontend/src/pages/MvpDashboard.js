import React, { useEffect, useState } from "react";
import "./MvpDashboard.css";
import { API_URL } from "../config";

const MODES = ["ONLINE", "OFFLINE", "BOTH"];
const SORT_OPTIONS = [
    ["rating", "Rating"],
    ["reviews", "Number of reviews"],
    ["rate", "Lowest rate"],
    ["experience", "Experience"],
    ["name", "Name"]
];
const SUBJECT_SORT_OPTIONS = [
    ["category", "Category and name"],
    ["rating", "Highest rated"],
    ["tutors", "Most tutor offerings"],
    ["sessions", "Most completed sessions"],
    ["demand", "Highest student demand"],
    ["rate", "Lowest starting rate"]
];

function MvpDashboard({ user, onLogout }) {
    const isStudent = user.role === "student";
    const [tab, setTab] = useState("home");
    const [subjects, setSubjects] = useState([]);
    const [subjectInsights, setSubjectInsights] = useState([]);
    const [subjectCategories, setSubjectCategories] = useState([]);
    const [subjectFilters, setSubjectFilters] = useState({ search: "", category: "", teachingMode: "", minRating: "", minTutors: "", maxRate: "" });
    const [subjectSort, setSubjectSort] = useState("category");
    const [locations, setLocations] = useState([]);
    const [tutors, setTutors] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [reviewBookings, setReviewBookings] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [sortBy, setSortBy] = useState("rating");
    const [filter, setFilter] = useState({ subjectID: "", location: "", teachingMode: "", minRate: "", maxRate: "", minRating: "" });
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [booking, setBooking] = useState({ tutorID: "", subjectID: "", sessionDate: "", startTime: "", endTime: "", teachingMode: "ONLINE" });
    const [requestForm, setRequestForm] = useState({ subjectID: "", budget: "", prefDate: "", prefStartTime: "", prefEndTime: "", teachingMode: "ONLINE" });
    const [review, setReview] = useState({ bookingID: "", rating: "5", comment: "" });
    const [complaint, setComplaint] = useState({ reportedUserID: "", description: "" });

    const api = async (path, options = {}) => {
        const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("findTutorToken")}`, ...options.headers } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed.");
        return data;
    };
    const show = (text) => { setMessage(text); setError(""); };
    const fail = (err) => { setError(err.message); setMessage(""); };
    const change = (setter, state) => (event) => setter({ ...state, [event.target.name]: event.target.value });

    const loadPersonal = async () => {
        try {
            const calls = [api("/api/bookings/my"), api("/api/requests/my")];
            if (isStudent) calls.push(api("/api/reviews/my-bookings")); else calls.push(api("/api/tutor/statistics"));
            const result = await Promise.all(calls);
            setBookings(result[0].bookings); setRequests(result[1].requests);
            if (isStudent) setReviewBookings(result[2].bookings); else setStatistics(result[2]);
        } catch (err) { fail(err); }
    };

    // Sorting (rating / reviews / rate / experience / name) is performed in SQL
    // via the sortBy query param — the backend maps it to a whitelisted ORDER BY.
    const searchTutors = async (event) => {
        if (event) event.preventDefault();
        try {
            const params = new URLSearchParams(Object.entries({ ...filter, sortBy }).filter(([, value]) => value !== ""));
            const data = await api(`/api/tutors/search?${params}`);
            setTutors(data.tutors);
        } catch (err) { fail(err); }
    };

    const searchSubjects = async (event) => {
        if (event) event.preventDefault();
        try {
            const params = new URLSearchParams(Object.entries({ ...subjectFilters, sortBy: subjectSort }).filter(([, value]) => value !== ""));
            const data = await api(`/api/subjects?${params}`);
            setSubjectInsights(data.subjects);
        } catch (err) { fail(err); }
    };

    const resetSubjectSearch = () => {
        setSubjectFilters({ search: "", category: "", teachingMode: "", minRating: "", minTutors: "", maxRate: "" });
        setSubjectSort("category");
        setSubjectInsights(subjects);
    };

    const openSubjectTutors = (subjectID) => {
        setFilter({ ...filter, subjectID: String(subjectID) });
        setTab("tutors");
    };

    useEffect(() => {
        Promise.all([api("/api/subjects"), api("/api/locations")]).then(([subjectData, locationData]) => {
            setSubjects(subjectData.subjects);
            setSubjectInsights(subjectData.subjects);
            setSubjectCategories(subjectData.categories);
            setLocations(locationData.locations);
        }).catch(fail);
        loadPersonal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Tutor searches intentionally rerun only when the directory opens or its
    // SQL-backed sort changes; form fields apply when the user submits them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (tab === "tutors") searchTutors(); }, [tab, sortBy]);

    const submit = async (path, body, success) => { try { const data = await api(path, { method: "POST", body: JSON.stringify(body) }); show(data.message || success); loadPersonal(); } catch (err) { fail(err); } };

    // Carries the full tutor record (including availability) into the booking
    // form, so the student can see when the tutor is free before picking a time.
    const selectTutor = (tutor) => {
        setSelectedTutor(tutor);
        setBooking({ ...booking, tutorID: String(tutor.tutorID), subjectID: filter.subjectID || "", teachingMode: tutor.teachingMode === "BOTH" ? "ONLINE" : tutor.teachingMode });
        setTab("book");
    };
    const clearSelectedTutor = () => { setSelectedTutor(null); setBooking({ ...booking, tutorID: "" }); };

    const cancel = async (id) => { try { await api(`/api/bookings/${id}/cancel`, { method: "PATCH" }); show("Booking cancelled."); loadPersonal(); } catch (err) { fail(err); } };
    const reschedule = async (id) => {
        const sessionDate = window.prompt("New date (YYYY-MM-DD):");
        const startTime = window.prompt("New start time (HH:MM:SS):");
        const endTime = window.prompt("New end time (HH:MM:SS):");
        if (!sessionDate || !startTime || !endTime) return;
        try { await api(`/api/bookings/${id}/reschedule`, { method: "PATCH", body: JSON.stringify({ sessionDate, startTime, endTime, teachingMode: "ONLINE" }) }); show("Booking rescheduled."); loadPersonal(); } catch (err) { fail(err); }
    };
    const updateStatus = async (id, status) => { try { await api(`/api/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); show("Booking status updated."); loadPersonal(); } catch (err) { fail(err); } };

    const nav = isStudent ? [["home", "Home"], ["subjects", "Explore Subjects"], ["tutors", "All Tutors"], ["book", "Book Tutor"], ["bookings", "My Bookings"], ["requests", "Tutor Requests"], ["reviews", "Reviews"]] : [["home", "Home"], ["subjects", "Explore Subjects"], ["bookings", "My Bookings"], ["requests", "Student Requests"]];

    return (
        <div className="mvp-page">
            <header className="mvp-header">
                <div><h1>Find Tutor</h1><span>{user.fullName} · {user.role}</span></div>
                <button onClick={onLogout}>Logout</button>
            </header>
            <nav className="mvp-nav">
                {nav.map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}
            </nav>
            <main className="mvp-main">
                {message && <div className="notice success">{message}</div>}
                {error && <div className="notice error">{error}</div>}
                {tab === "home" && <Home user={user} statistics={statistics} complaint={complaint} setComplaint={setComplaint} change={change} submit={submit} />}
                {tab === "subjects" && <SubjectExplorer subjects={subjectInsights} categories={subjectCategories} filters={subjectFilters} setFilters={setSubjectFilters} change={change} search={searchSubjects} reset={resetSubjectSearch} sortBy={subjectSort} setSortBy={setSubjectSort} openTutors={openSubjectTutors} />}
                {tab === "tutors" && <TutorDirectory filter={filter} setFilter={setFilter} subjects={subjects} locations={locations} change={change} search={searchTutors} tutors={tutors} sortBy={sortBy} setSortBy={setSortBy} selectTutor={selectTutor} />}
                {tab === "book" && <BookingForm booking={booking} setBooking={setBooking} change={change} subjects={subjects} submit={submit} selectedTutor={selectedTutor} clearSelectedTutor={clearSelectedTutor} goToTutors={() => setTab("tutors")} />}
                {tab === "bookings" && <BookingList bookings={bookings} isStudent={isStudent} cancel={cancel} reschedule={reschedule} updateStatus={updateStatus} />}
                {tab === "requests" && <RequestPage isStudent={isStudent} form={requestForm} setForm={setRequestForm} change={change} subjects={subjects} requests={requests} submit={submit} />}
                {tab === "reviews" && <ReviewPage review={review} setReview={setReview} change={change} reviewBookings={reviewBookings} submit={submit} />}
            </main>
        </div>
    );
}

function Home({ user, statistics, complaint, setComplaint, change, submit }) {
    return (
        <>
            <section className="panel">
                <h2>Welcome, {user.fullName}</h2>
                <p>Use the navigation above to manage your tutoring activity.</p>
                {user.role === "tutor" && statistics && (
                    <div className="stats">
                        <Stat label="Current students" value={statistics.overview.currentStudents} />
                        <Stat label="Completed students" value={statistics.overview.completedStudents} />
                        <Stat label="Total sessions" value={statistics.overview.totalSessions} />
                        <Stat label="Earnings" value={`৳${statistics.overview.totalEarnings}`} />
                        <Stat label="Rating" value={`${statistics.rating.averageRating} / 5`} />
                    </div>
                )}
            </section>
            <section className="panel compact">
                <h2>Submit a Complaint</h2>
                <form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit("/api/complaints", complaint, "Complaint submitted."); setComplaint({ reportedUserID: "", description: "" }); }}>
                    <input name="reportedUserID" type="number" placeholder="Reported user ID" value={complaint.reportedUserID} onChange={change(setComplaint, complaint)} required />
                    <textarea name="description" placeholder="Describe the issue" value={complaint.description} onChange={change(setComplaint, complaint)} required />
                    <button>Submit Complaint</button>
                </form>
            </section>
        </>
    );
}

function SubjectExplorer({ subjects, categories, filters, setFilters, change, search, reset, sortBy, setSortBy, openTutors }) {
    const totals = subjects.reduce((summary, subject) => ({
        offerings: summary.offerings + Number(subject.tutorOfferingCount),
        sessions: summary.sessions + Number(subject.completedSessions),
        requests: summary.requests + Number(subject.openTutorRequests)
    }), { offerings: 0, sessions: 0, requests: 0 });

    return (
        <>
            <section className="panel subject-intro">
                <div>
                    <span className="eyebrow">FT9 · Subject discovery</span>
                    <h2>Explore Subjects</h2>
                    <p>Compare tutor supply, hourly rates, learner demand, completed sessions, and verified review ratings before choosing what to study or teach.</p>
                </div>
                <div className="stats subject-summary">
                    <Stat label="Matching subjects" value={subjects.length} />
                    <Stat label="Tutor offerings" value={totals.offerings} />
                    <Stat label="Completed sessions" value={totals.sessions} />
                    <Stat label="Open requests" value={totals.requests} />
                </div>
            </section>

            <section className="panel">
                <h2>Find the right subject</h2>
                <form className="form-grid subject-filters" onSubmit={search}>
                    <label className="field-label">Subject or category
                        <input name="search" placeholder="e.g. Programming" value={filters.search} onChange={change(setFilters, filters)} />
                    </label>
                    <label className="field-label">Category
                        <select name="category" value={filters.category} onChange={change(setFilters, filters)}>
                            <option value="">All categories</option>
                            {categories.map(category => <option key={category}>{category}</option>)}
                        </select>
                    </label>
                    <label className="field-label">Teaching mode
                        <select name="teachingMode" value={filters.teachingMode} onChange={change(setFilters, filters)}>
                            <option value="">Any mode</option>
                            <option value="ONLINE">Online available</option>
                            <option value="OFFLINE">Offline available</option>
                        </select>
                    </label>
                    <label className="field-label">Minimum rating
                        <input name="minRating" type="number" min="0" max="5" step="0.1" placeholder="0–5" value={filters.minRating} onChange={change(setFilters, filters)} />
                    </label>
                    <label className="field-label">Minimum tutors
                        <input name="minTutors" type="number" min="0" step="1" placeholder="Any" value={filters.minTutors} onChange={change(setFilters, filters)} />
                    </label>
                    <label className="field-label">Maximum starting rate
                        <input name="maxRate" type="number" min="0" step="50" placeholder="৳ per hour" value={filters.maxRate} onChange={change(setFilters, filters)} />
                    </label>
                    <label className="field-label">Sort results
                        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                            {SUBJECT_SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    <div className="filter-actions">
                        <button>Apply filters</button>
                        <button type="button" className="secondary-button" onClick={reset}>Reset</button>
                    </div>
                </form>
            </section>

            <div className="subject-grid">
                {subjects.map(subject => <SubjectCard key={subject.subjectID} subject={subject} openTutors={openTutors} />)}
                {!subjects.length && <div className="panel empty-state"><h2>No matching subjects</h2><p className="hint">Try lowering the rating or tutor requirements, increasing the maximum rate, or clearing the category.</p></div>}
            </div>
        </>
    );
}

function SubjectCard({ subject, openTutors }) {
    const hasRates = subject.minimumRate !== null;
    const rating = Number(subject.reviewCount) > 0 ? `${Number(subject.averageRating).toFixed(1)} / 5` : "Not rated";
    const rateRange = hasRates ? `৳${Number(subject.minimumRate).toFixed(0)}–৳${Number(subject.maximumRate).toFixed(0)} / hour` : "No tutor rates yet";

    return (
        <article className="subject-card">
            <div className="subject-card-heading">
                <div><span className="category-badge">{subject.category || "Uncategorized"}</span><h3>{subject.subjectName}</h3></div>
                <div className="rating-block"><strong>{rating}</strong><span>{subject.reviewCount} reviews</span></div>
            </div>
            <div className="subject-metrics">
                <Stat label="Tutor offerings" value={subject.tutorOfferingCount} />
                <Stat label="With availability" value={subject.availableTutorCount} />
                <Stat label="Completed sessions" value={subject.completedSessions} />
                <Stat label="Open requests" value={subject.openTutorRequests} />
            </div>
            <div className="subject-details">
                <p><b>Market rate:</b> {rateRange}</p>
                <p><b>Average rate:</b> {hasRates ? `৳${Number(subject.averageRate).toFixed(0)} / hour` : "—"}</p>
                <p><b>Teaching access:</b> {subject.onlineTutorCount} online · {subject.offlineTutorCount} offline</p>
                <p><b>Demand per tutor:</b> {subject.demandPerTutor === null ? "No tutors available" : Number(subject.demandPerTutor).toFixed(2)}</p>
                <p><b>Last booked:</b> {subject.lastBookedOn ? String(subject.lastBookedOn).slice(0, 10) : "No bookings yet"}</p>
            </div>
            <button disabled={!Number(subject.tutorOfferingCount)} onClick={() => openTutors(subject.subjectID)}>Browse tutors for this subject</button>
        </article>
    );
}

function TutorDirectory({ filter, setFilter, subjects, locations, change, search, tutors, sortBy, setSortBy, selectTutor }) {
    return (
        <>
            <section className="panel">
                <h2>All Tutors</h2>
                <form className="form-grid filters" onSubmit={search}>
                    <SubjectSelect subjects={subjects} form={filter} change={change(setFilter, filter)} optional />
                    <select name="location" value={filter.location} onChange={change(setFilter, filter)}>
                        <option value="">All locations</option>
                        {locations.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <select name="teachingMode" value={filter.teachingMode} onChange={change(setFilter, filter)}>
                        <option value="">Any mode</option>
                        {MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input name="minRate" placeholder="Minimum rate" value={filter.minRate} onChange={change(setFilter, filter)} />
                    <input name="maxRate" placeholder="Maximum rate" value={filter.maxRate} onChange={change(setFilter, filter)} />
                    <input name="minRating" placeholder="Minimum rating" value={filter.minRating} onChange={change(setFilter, filter)} />
                    <button>Search</button>
                </form>
            </section>
            <div className="directory-toolbar">
                <strong>{tutors.length} tutors found</strong>
                <label>Sort by
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </label>
            </div>
            <div className="tutor-grid">
                {tutors.map(t => (
                    <article className="tutor-card" key={t.tutorID}>
                        <h3>{t.fullName}</h3>
                        <p><b>ID:</b> {t.tutorID} · {t.location} · {t.teachingMode}</p>
                        <p>{t.bio}</p>
                        <p><b>Subjects:</b> {t.subjects}</p>
                        <p className="availability-line"><b>Availability:</b> {t.availability || "No availability listed"}</p>
                        <p><b>Rate:</b> ৳{t.minimumRate}/hour · <b>Rating:</b> {t.averageRating} ({t.reviewCount} reviews) · <b>Experience:</b> {t.exp_year} yrs</p>
                        <button onClick={() => selectTutor(t)}>Book this tutor</button>
                    </article>
                ))}
                {!tutors.length && <p className="hint">No tutors match the current filters.</p>}
            </div>
        </>
    );
}

function BookingForm({ booking, setBooking, change, subjects, submit, selectedTutor, clearSelectedTutor, goToTutors }) {
    return (
        <section className="panel form-panel">
            <h2>Book a Tutor</h2>

            {selectedTutor ? (
                <div className="availability-card">
                    <div className="availability-card-header">
                        <div>
                            <strong>{selectedTutor.fullName}</strong>
                            <span className="hint"> · {selectedTutor.location} · {selectedTutor.teachingMode}</span>
                        </div>
                        <button type="button" className="link-button" onClick={clearSelectedTutor}>Change tutor</button>
                    </div>
                    <p className="hint">Rate from ৳{selectedTutor.minimumRate}/hour · Rating {selectedTutor.averageRating} ({selectedTutor.reviewCount} reviews)</p>
                    <p><b>Available:</b> {selectedTutor.availability || "This tutor has not listed any availability yet."}</p>
                    <p className="hint">Pick a date whose day of week matches one of the slots above, and a time inside that slot.</p>
                </div>
            ) : (
                <p className="hint">
                    No tutor selected yet. <button type="button" className="link-button" onClick={goToTutors}>Browse All Tutors</button> to see availability before booking, or enter a Tutor ID below.
                </p>
            )}

            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit("/api/bookings", booking, "Booking request created."); }}>
                {selectedTutor ? (
                    <input type="hidden" name="tutorID" value={booking.tutorID} />
                ) : (
                    <input name="tutorID" type="number" placeholder="Tutor ID" value={booking.tutorID} onChange={change(setBooking, booking)} required />
                )}
                <SubjectSelect subjects={subjects} form={booking} change={change(setBooking, booking)} />
                <input name="sessionDate" type="date" value={booking.sessionDate} onChange={change(setBooking, booking)} required />
                <input name="startTime" type="time" value={booking.startTime} onChange={change(setBooking, booking)} required />
                <input name="endTime" type="time" value={booking.endTime} onChange={change(setBooking, booking)} required />
                <ModeSelect form={booking} change={change(setBooking, booking)} />
                <button>Request Booking</button>
            </form>
            <p className="hint">The server re-checks the tutor's availability and looks for conflicting bookings before confirming — this list is a guide, not a guarantee.</p>
        </section>
    );
}

function BookingList({ bookings, isStudent, cancel, reschedule, updateStatus }) {
    return (
        <section className="panel">
            <h2>My Bookings</h2>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Date</th><th>Time</th><th>Subject</th><th>{isStudent ? "Tutor" : "Student"}</th><th>Rate</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        {bookings.map(b => (
                            <tr key={b.bookingID}>
                                <td>{String(b.sessionDate).slice(0, 10)}</td>
                                <td>{String(b.startTime).slice(0, 5)}–{String(b.endTime).slice(0, 5)}</td>
                                <td>{b.subjectName}</td>
                                <td>{isStudent ? b.tutorName : b.studentName}</td>
                                <td>৳{b.agreedRate}</td>
                                <td>{b.status}</td>
                                <td>
                                    {isStudent && ["PENDING", "CONFIRMED"].includes(b.status) && (
                                        <>
                                            <button onClick={() => cancel(b.bookingID)}>Cancel</button>
                                            <button onClick={() => reschedule(b.bookingID)}>Reschedule</button>
                                        </>
                                    )}
                                    {!isStudent && b.status === "PENDING" && <button onClick={() => updateStatus(b.bookingID, "CONFIRMED")}>Confirm</button>}
                                    {!isStudent && b.status === "CONFIRMED" && <button onClick={() => updateStatus(b.bookingID, "COMPLETED")}>Complete</button>}
                                </td>
                            </tr>
                        ))}
                        {!bookings.length && <tr><td colSpan="7" className="hint">No bookings yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function RequestPage({ isStudent, form, setForm, change, subjects, requests, submit }) {
    return (
        <section className="panel">
            <h2>{isStudent ? "Post a Tutor Request" : "Post a Student Request"}</h2>
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit(isStudent ? "/api/requests/tutor" : "/api/requests/student", form, "Request posted."); }}>
                <SubjectSelect subjects={subjects} form={form} change={change(setForm, form)} />
                <input name="budget" type="number" placeholder="Maximum budget" value={form.budget} onChange={change(setForm, form)} />
                <input name="prefDate" type="date" value={form.prefDate} onChange={change(setForm, form)} required />
                <input name="prefStartTime" type="time" value={form.prefStartTime} onChange={change(setForm, form)} required />
                <input name="prefEndTime" type="time" value={form.prefEndTime} onChange={change(setForm, form)} required />
                <ModeSelect form={form} change={change(setForm, form)} />
                <button>Post Request</button>
            </form>
            <SimpleRows rows={requests} />
        </section>
    );
}

function ReviewPage({ review, setReview, change, reviewBookings, submit }) {
    return (
        <section className="panel">
            <h2>Review a Completed Session</h2>
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit("/api/reviews", review, "Review submitted."); }}>
                <select name="bookingID" value={review.bookingID} onChange={change(setReview, review)} required>
                    <option value="">Select booking</option>
                    {reviewBookings.filter(b => !b.reviewID).map(b => <option key={b.bookingID} value={b.bookingID}>{b.tutorName} — {b.subjectName}</option>)}
                </select>
                <select name="rating" value={review.rating} onChange={change(setReview, review)}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
                </select>
                <input name="comment" placeholder="Comment" value={review.comment} onChange={change(setReview, review)} />
                <button>Submit Review</button>
            </form>
            <SimpleRows rows={reviewBookings} />
        </section>
    );
}

function SubjectSelect({ subjects, form, change, optional }) {
    const groupedSubjects = subjects.reduce((groups, subject) => {
        const category = subject.category || "Other";
        groups[category] = groups[category] || [];
        groups[category].push(subject);
        return groups;
    }, {});

    return (
        <select name="subjectID" value={form.subjectID} onChange={change} required={!optional}>
            <option value="">{optional ? "All subjects" : "Select subject"}</option>
            {Object.entries(groupedSubjects).map(([category, categorySubjects]) => (
                <optgroup key={category} label={category}>
                    {categorySubjects.map(subject => <option key={subject.subjectID} value={subject.subjectID}>{subject.subjectName}</option>)}
                </optgroup>
            ))}
        </select>
    );
}
function ModeSelect({ form, change }) { return <select name="teachingMode" value={form.teachingMode} onChange={change}>{MODES.map(m => <option key={m}>{m}</option>)}</select>; }
function Stat({ label, value }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
function SimpleRows({ rows }) { return !rows.length ? <p className="hint">No records yet.</p> : <div className="table-wrap"><table><thead><tr>{Object.keys(rows[0]).map(k => <th key={k}>{k}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.requestID || row.bookingID || i}>{Object.keys(rows[0]).map(k => <td key={k}>{String(row[k] ?? "-")}</td>)}</tr>)}</tbody></table></div>; }

export default MvpDashboard;
