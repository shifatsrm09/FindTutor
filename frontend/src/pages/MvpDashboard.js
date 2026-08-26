import React, { useEffect, useState } from "react";
import "./MvpDashboard.css";

const API = "http://localhost:5000";
const MODES = ["ONLINE", "OFFLINE", "BOTH"];

function MvpDashboard({ user, onLogout }) {
    const isStudent = user.role === "student";
    const [tab, setTab] = useState("home");
    const [subjects, setSubjects] = useState([]);
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
    const [booking, setBooking] = useState({ tutorID: "", subjectID: "", sessionDate: "", startTime: "", endTime: "", teachingMode: "ONLINE" });
    const [requestForm, setRequestForm] = useState({ subjectID: "", budget: "", prefDate: "", prefStartTime: "", prefEndTime: "", teachingMode: "ONLINE" });
    const [review, setReview] = useState({ bookingID: "", rating: "5", comment: "" });
    const [complaint, setComplaint] = useState({ reportedUserID: "", description: "" });

    const api = async (path, options = {}) => {
        const response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("findTutorToken")}`, ...options.headers } });
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
    const searchTutors = async (event) => {
        if (event) event.preventDefault();
        try {
            const params = new URLSearchParams(Object.entries(filter).filter(([, value]) => value !== ""));
            const data = await api(`/api/tutors/search?${params}`);
            setTutors(data.tutors);
        } catch (err) { fail(err); }
    };
    useEffect(() => {
        Promise.all([api("/api/subjects"), api("/api/locations")]).then(([subjectData, locationData]) => { setSubjects(subjectData.subjects); setLocations(locationData.locations); }).catch(fail);
        loadPersonal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { if (tab === "tutors") searchTutors(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

    const submit = async (path, body, success) => { try { const data = await api(path, { method: "POST", body: JSON.stringify(body) }); show(data.message || success); loadPersonal(); } catch (err) { fail(err); } };
    const selectTutor = (tutor) => { setBooking({ ...booking, tutorID: String(tutor.tutorID), subjectID: filter.subjectID || "", teachingMode: tutor.teachingMode === "BOTH" ? "ONLINE" : tutor.teachingMode }); setTab("book"); };
    const cancel = async (id) => { try { await api(`/api/bookings/${id}/cancel`, { method: "PATCH" }); show("Booking cancelled."); loadPersonal(); } catch (err) { fail(err); } };
    const reschedule = async (id) => {
        const sessionDate = window.prompt("New date (YYYY-MM-DD):");
        const startTime = window.prompt("New start time (HH:MM:SS):");
        const endTime = window.prompt("New end time (HH:MM:SS):");
        if (!sessionDate || !startTime || !endTime) return;
        try { await api(`/api/bookings/${id}/reschedule`, { method: "PATCH", body: JSON.stringify({ sessionDate, startTime, endTime, teachingMode: "ONLINE" }) }); show("Booking rescheduled."); loadPersonal(); } catch (err) { fail(err); }
    };
    const updateStatus = async (id, status) => { try { await api(`/api/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); show("Booking status updated."); loadPersonal(); } catch (err) { fail(err); } };

    const sortedTutors = [...tutors].sort((a, b) => sortBy === "rate" ? Number(a.minimumRate) - Number(b.minimumRate) : sortBy === "sessions" ? Number(b.completedSessions) - Number(a.completedSessions) : Number(b.averageRating) - Number(a.averageRating));
    const nav = isStudent ? [["home", "Home"], ["tutors", "All Tutors"], ["book", "Book Tutor"], ["bookings", "My Bookings"], ["requests", "Tutor Requests"], ["reviews", "Reviews"]] : [["home", "Home"], ["bookings", "My Bookings"], ["requests", "Student Requests"]];

    return <div className="mvp-page"><header className="mvp-header"><div><h1>Find Tutor</h1><span>{user.fullName} · {user.role}</span></div><button onClick={onLogout}>Logout</button></header><nav className="mvp-nav">{nav.map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</nav><main className="mvp-main">{message && <div className="notice success">{message}</div>}{error && <div className="notice error">{error}</div>}{tab === "home" && <Home user={user} statistics={statistics} complaint={complaint} setComplaint={setComplaint} change={change} submit={submit} />} {tab === "tutors" && <TutorDirectory filter={filter} setFilter={setFilter} subjects={subjects} locations={locations} change={change} search={searchTutors} tutors={sortedTutors} sortBy={sortBy} setSortBy={setSortBy} selectTutor={selectTutor} />} {tab === "book" && <BookingForm booking={booking} setBooking={setBooking} change={change} subjects={subjects} submit={submit} />} {tab === "bookings" && <BookingList bookings={bookings} isStudent={isStudent} cancel={cancel} reschedule={reschedule} updateStatus={updateStatus} />} {tab === "requests" && <RequestPage isStudent={isStudent} form={requestForm} setForm={setRequestForm} change={change} subjects={subjects} requests={requests} submit={submit} />} {tab === "reviews" && <ReviewPage review={review} setReview={setReview} change={change} reviewBookings={reviewBookings} submit={submit} />}</main></div>;
}

function Home({ user, statistics, complaint, setComplaint, change, submit }) { return <><section className="panel"><h2>Welcome, {user.fullName}</h2><p>Use the navigation above to manage your tutoring activity.</p>{user.role === "tutor" && statistics && <div className="stats"><Stat label="Current students" value={statistics.overview.currentStudents} /><Stat label="Completed students" value={statistics.overview.completedStudents} /><Stat label="Total sessions" value={statistics.overview.totalSessions} /><Stat label="Earnings" value={`৳${statistics.overview.totalEarnings}`} /><Stat label="Rating" value={`${statistics.rating.averageRating} / 5`} /></div>}</section><section className="panel compact"><h2>Submit a Complaint</h2><form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit("/api/complaints", complaint, "Complaint submitted."); setComplaint({ reportedUserID: "", description: "" }); }}><input name="reportedUserID" type="number" placeholder="Reported user ID" value={complaint.reportedUserID} onChange={change(setComplaint, complaint)} required /><textarea name="description" placeholder="Describe the issue" value={complaint.description} onChange={change(setComplaint, complaint)} required /><button>Submit Complaint</button></form></section></>; }
function TutorDirectory({ filter, setFilter, subjects, locations, change, search, tutors, sortBy, setSortBy, selectTutor }) { return <><section className="panel"><h2>All Tutors</h2><form className="form-grid filters" onSubmit={search}><SubjectSelect subjects={subjects} form={filter} change={change(setFilter, filter)} optional /><select name="location" value={filter.location} onChange={change(setFilter, filter)}><option value="">All locations</option>{locations.map(l => <option key={l}>{l}</option>)}</select><select name="teachingMode" value={filter.teachingMode} onChange={change(setFilter, filter)}><option value="">Any mode</option>{MODES.map(m => <option key={m}>{m}</option>)}</select><input name="minRate" placeholder="Minimum rate" value={filter.minRate} onChange={change(setFilter, filter)} /><input name="maxRate" placeholder="Maximum rate" value={filter.maxRate} onChange={change(setFilter, filter)} /><input name="minRating" placeholder="Minimum rating" value={filter.minRating} onChange={change(setFilter, filter)} /><button>Search</button></form></section><div className="directory-toolbar"><strong>{tutors.length} tutors found</strong><label>Sort by <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="rating">Rating</option><option value="sessions">Completed sessions</option><option value="rate">Lowest rate</option></select></label></div><div className="tutor-grid">{tutors.map(t => <article className="tutor-card" key={t.tutorID}><h3>{t.fullName}</h3><p><b>ID:</b> {t.tutorID} · {t.location}</p><p>{t.bio}</p><p><b>Subjects:</b> {t.subjects}</p><p><b>Available:</b> {t.availability || "No availability listed"}</p><p><b>Rate:</b> ৳{t.minimumRate}/hour · <b>Rating:</b> {t.averageRating} · <b>Completed:</b> {t.completedSessions}</p><button onClick={() => selectTutor(t)}>Book this tutor</button></article>)}</div></>; }
function BookingForm({ booking, setBooking, change, subjects, submit }) { return <section className="panel form-panel"><h2>Book a Tutor</h2><p className="hint">Check the tutor's displayed availability, then choose a matching date and time.</p><form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit("/api/bookings", booking, "Booking request created."); }}><input name="tutorID" type="number" placeholder="Tutor ID" value={booking.tutorID} onChange={change(setBooking, booking)} required /><SubjectSelect subjects={subjects} form={booking} change={change(setBooking, booking)} /><input name="sessionDate" type="date" value={booking.sessionDate} onChange={change(setBooking, booking)} required /><input name="startTime" type="time" value={booking.startTime} onChange={change(setBooking, booking)} required /><input name="endTime" type="time" value={booking.endTime} onChange={change(setBooking, booking)} required /><ModeSelect form={booking} change={change(setBooking, booking)} /><button>Request Booking</button></form></section>; }
function BookingList({ bookings, isStudent, cancel, reschedule, updateStatus }) { return <section className="panel"><h2>My Bookings</h2><div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>{isStudent ? "Tutor" : "Student"}</th><th>Rate</th><th>Status</th><th>Action</th></tr></thead><tbody>{bookings.map(b => <tr key={b.bookingID}><td>{String(b.sessionDate).slice(0, 10)}</td><td>{String(b.startTime).slice(0, 5)}–{String(b.endTime).slice(0, 5)}</td><td>{b.subjectName}</td><td>{isStudent ? b.tutorName : b.studentName}</td><td>৳{b.agreedRate}</td><td>{b.status}</td><td>{isStudent && ["PENDING", "CONFIRMED"].includes(b.status) && <><button onClick={() => cancel(b.bookingID)}>Cancel</button><button onClick={() => reschedule(b.bookingID)}>Reschedule</button></>}{!isStudent && b.status === "PENDING" && <button onClick={() => updateStatus(b.bookingID, "CONFIRMED")}>Confirm</button>}{!isStudent && b.status === "CONFIRMED" && <button onClick={() => updateStatus(b.bookingID, "COMPLETED")}>Complete</button>}</td></tr>)}</tbody></table></div></section>; }
function RequestPage({ isStudent, form, setForm, change, subjects, requests, submit }) { return <section className="panel"><h2>{isStudent ? "Post a Tutor Request" : "Post a Student Request"}</h2><form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit(isStudent ? "/api/requests/tutor" : "/api/requests/student", form, "Request posted."); }}><SubjectSelect subjects={subjects} form={form} change={change(setForm, form)} /><input name="budget" type="number" placeholder="Maximum budget" value={form.budget} onChange={change(setForm, form)} /><input name="prefDate" type="date" value={form.prefDate} onChange={change(setForm, form)} required /><input name="prefStartTime" type="time" value={form.prefStartTime} onChange={change(setForm, form)} required /><input name="prefEndTime" type="time" value={form.prefEndTime} onChange={change(setForm, form)} required /><ModeSelect form={form} change={change(setForm, form)} /><button>Post Request</button></form><SimpleRows rows={requests} /></section>; }
function ReviewPage({ review, setReview, change, reviewBookings, submit }) { return <section className="panel"><h2>Review a Completed Session</h2><form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit("/api/reviews", review, "Review submitted."); }}><select name="bookingID" value={review.bookingID} onChange={change(setReview, review)} required><option value="">Select booking</option>{reviewBookings.filter(b => !b.reviewID).map(b => <option key={b.bookingID} value={b.bookingID}>{b.tutorName} — {b.subjectName}</option>)}</select><select name="rating" value={review.rating} onChange={change(setReview, review)}>{[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}</select><input name="comment" placeholder="Comment" value={review.comment} onChange={change(setReview, review)} /><button>Submit Review</button></form><SimpleRows rows={reviewBookings} /></section>; }
function SubjectSelect({ subjects, form, change, optional }) { return <select name="subjectID" value={form.subjectID} onChange={change} required={!optional}><option value="">{optional ? "All subjects" : "Select subject"}</option>{subjects.map(s => <option key={s.subjectID} value={s.subjectID}>{s.subjectName}</option>)}</select>; }
function ModeSelect({ form, change }) { return <select name="teachingMode" value={form.teachingMode} onChange={change}>{MODES.map(m => <option key={m}>{m}</option>)}</select>; }
function Stat({ label, value }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
function SimpleRows({ rows }) { return !rows.length ? <p className="hint">No records yet.</p> : <div className="table-wrap"><table><thead><tr>{Object.keys(rows[0]).map(k => <th key={k}>{k}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.requestID || row.bookingID || i}>{Object.keys(rows[0]).map(k => <td key={k}>{String(row[k] ?? "-")}</td>)}</tr>)}</tbody></table></div>; }
export default MvpDashboard;
