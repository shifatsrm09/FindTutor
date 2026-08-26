const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();
const LOCATIONS = ["Badda", "Gulshan", "Uttara", "Banani", "Mirpur", "Norda", "Rampura", "Tongi", "Merul"];

app.use(cors());
app.use(express.json());

// ==================================================
// MYSQL CONNECTION
// ==================================================

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==================================================
// SQL FILE LOADER
// ==================================================

function loadSQL(...folders) {
    const filePath = path.join(__dirname, "queries", ...folders);

    return fs.readFileSync(filePath, "utf8");
}

const signupSQL = loadSQL("FT0_authentication", "signup.sql");
const signupStudentSQL = loadSQL("FT0_authentication", "signup_student.sql");
const signupTutorSQL = loadSQL("FT0_authentication", "signup_tutor.sql");
const loginSQL = loadSQL("FT0_authentication", "login.sql");
const meSQL = loadSQL("FT0_authentication", "me.sql");
const adminOverviewSQL = loadSQL("FT1_admin", "overview.sql");
const adminUsersSQL = loadSQL("FT1_admin", "users.sql");
const banUserSQL = loadSQL("FT1_admin", "ban_user.sql");
const unbanUserSQL = loadSQL("FT1_admin", "unban_user.sql");
const adminComplaintsSQL = loadSQL("FT1_admin", "complaints.sql");
const resolveComplaintSQL = loadSQL("FT1_admin", "resolve_complaint.sql");
const createComplaintSQL = loadSQL("FT8_complaints", "create.sql");
const subjectsSQL = loadSQL("FT9_common", "subjects.sql");
const tutorSubjectRateSQL = loadSQL("FT2_booking", "tutor_subject_rate.sql");
const availabilityCheckSQL = loadSQL("FT2_booking", "availability_check.sql");
const bookingConflictSQL = loadSQL("FT2_booking", "booking_conflict.sql");
const rescheduleConflictSQL = loadSQL("FT2_booking", "reschedule_conflict.sql");
const createBookingSQL = loadSQL("FT2_booking", "create_booking.sql");
const studentBookingsSQL = loadSQL("FT2_booking", "student_bookings.sql");
const tutorBookingsSQL = loadSQL("FT2_booking", "tutor_bookings.sql");
const cancelBookingSQL = loadSQL("FT2_booking", "cancel_booking.sql");
const rescheduleBookingSQL = loadSQL("FT2_booking", "reschedule_booking.sql");
const bookingDetailsSQL = loadSQL("FT2_booking", "booking_details.sql");
const tutorUpdateBookingStatusSQL = loadSQL("FT2_booking", "tutor_update_booking_status.sql");
const searchTutorsSQL = loadSQL("FT3_search", "search_tutors.sql");
const tutorOverviewSQL = loadSQL("FT4_statistics", "tutor_overview.sql");
const earningsBySubjectSQL = loadSQL("FT4_statistics", "earnings_by_subject.sql");
const earningsByMonthSQL = loadSQL("FT4_statistics", "earnings_by_month.sql");
const rankTutorsSQL = loadSQL("FT5_ranking", "rank_tutors.sql");
const eligibleBookingSQL = loadSQL("FT6_reviews", "eligible_booking.sql");
const createReviewSQL = loadSQL("FT6_reviews", "create_review.sql");
const myReviewableBookingsSQL = loadSQL("FT6_reviews", "my_reviewable_bookings.sql");
const tutorRatingSQL = loadSQL("FT6_reviews", "tutor_rating.sql");
const createTutorRequestSQL = loadSQL("FT7_requests_matching", "create_tutor_request.sql");
const createStudentRequestSQL = loadSQL("FT7_requests_matching", "create_student_request.sql");
const studentTutorRequestsSQL = loadSQL("FT7_requests_matching", "student_tutor_requests.sql");
const tutorStudentRequestsSQL = loadSQL("FT7_requests_matching", "tutor_student_requests.sql");
const openTutorRequestsSQL = loadSQL("FT7_requests_matching", "open_tutor_requests.sql");
const openStudentRequestsSQL = loadSQL("FT7_requests_matching", "open_student_requests.sql");
const matchTutorsForRequestSQL = loadSQL("FT7_requests_matching", "match_tutors_for_request.sql");
const matchStudentsForRequestSQL = loadSQL("FT7_requests_matching", "match_students_for_request.sql");

// ==================================================
// JWT CONFIGURATION
// ==================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("JWT_SECRET is missing from .env");
    process.exit(1);
}

// ==================================================
// TEST DATABASE CONNECTION
// ==================================================

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT 1 AS connected"
        );

        res.json({
            success: true,
            message: "MySQL connection successful!",
            data: rows
        });

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed.",
            error: error.message
        });
    }
});

// ==================================================
// SIGNUP
// ==================================================

app.post("/api/auth/signup", async (req, res) => {

    const {
        fullName,
        email,
        password,
        phone,
        location,
        role,
        institution,
        bio,
        exp_year,
        teachingMode
    } = req.body;

    // -------------------------------
    // Validate input
    // -------------------------------

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({
            success: false,
            message:
                "Full name, email, password and role are required."
        });
    }

    if (role !== "student" && role !== "tutor") {
        return res.status(400).json({
            success: false,
            message: "Invalid role."
        });
    }

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        // -------------------------------
        // Check existing email
        // -------------------------------

        const [existingUsers] = await connection.execute(
            "SELECT userID FROM USER WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        // -------------------------------
        // Insert USER
        // -------------------------------

        const [userResult] = await connection.execute(
            signupSQL,
            [
                fullName,
                email,
                password,
                phone || null,
                location || null
            ]
        );

        const userID = userResult.insertId;

        // -------------------------------
        // Insert STUDENT / TUTOR
        // -------------------------------

        if (role === "student") {

            await connection.execute(
                signupStudentSQL,
                [
                    userID,
                    institution || null
                ]
            );

        } else {

            await connection.execute(
                signupTutorSQL,
                [
                    userID,
                    bio || null,
                    exp_year || null,
                    teachingMode || null
                ]
            );
        }

        // -------------------------------
        // Save transaction
        // -------------------------------

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user: {
                userID,
                fullName,
                email,
                role
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error("Signup error:", error);

        res.status(500).json({
            success: false,
            message: "Signup failed.",
            error: error.message
        });

    } finally {

        connection.release();
    }
});

// ==================================================
// LOGIN
// ==================================================

app.post("/api/auth/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;

    // -------------------------------
    // Validate input
    // -------------------------------

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    if (location && !LOCATIONS.includes(location)) {
        return res.status(400).json({
            success: false,
            message: "Please select a valid project location."
        });
    }

    try {

        // Special MVP administrator account.
        if (email === "admin" && password === "admin") {

            const token = jwt.sign(
                { userID: 0, role: "admin" },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.json({
                success: true,
                message: "Admin login successful.",
                token,
                user: {
                    userID: 0,
                    fullName: "System Administrator",
                    email: "admin",
                    role: "admin"
                }
            });
        }

        // -------------------------------
        // Find user
        // -------------------------------

        const [users] = await db.execute(
            loginSQL,
            [email]
        );

        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: "This account has been banned by an administrator."
            });
        }

        // Passwords are temporarily stored as plain text for this MVP.
        if (password !== user.password) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // -------------------------------
        // Check role
        // -------------------------------

        if (!user.role) {

            return res.status(400).json({
                success: false,
                message: "User role could not be determined."
            });
        }

        // -------------------------------
        // Create JWT
        // -------------------------------

        const token = jwt.sign(
            {
                userID: user.userID,
                role: user.role
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // -------------------------------
        // Send response
        // -------------------------------

        res.json({
            success: true,
            message: "Login successful.",

            token,

            user: {
                userID: user.userID,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

// ==================================================
// AUTHENTICATION MIDDLEWARE
// ==================================================

function authenticateToken(req, res, next) {

    const authHeader = req.headers.authorization;

    // No Authorization header
    if (!authHeader) {

        return res.status(401).json({
            success: false,
            message: "Authentication token is required."
        });
    }

    const parts = authHeader.split(" ");

    // Expected:
    // Authorization: Bearer TOKEN

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        return res.status(401).json({
            success: false,
            message: "Invalid authentication format."
        });
    }

    const token = parts[1];

    try {

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
}

function requireAdmin(req, res, next) {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Administrator access is required."
        });
    }

    next();
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `${role} access is required.`
            });
        }

        next();
    };
}

function validTimeRange(startTime, endTime) {
    return typeof startTime === "string" &&
        typeof endTime === "string" &&
        startTime < endTime;
}

function normalizeOptionalNumber(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

// ==================================================
// GET CURRENT USER
// ==================================================

app.get(
    "/api/auth/me",
    authenticateToken,
    async (req, res) => {

        try {

            if (req.user.role === "admin") {
                return res.json({
                    success: true,
                    user: {
                        userID: 0,
                        fullName: "System Administrator",
                        email: "admin",
                        role: "admin"
                    }
                });
            }

            const [users] = await db.execute(
                meSQL,
                [req.user.userID]
            );

            if (users.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User no longer exists."
                });
            }

            const user = users[0];

            if (user.isBanned) {
                return res.status(403).json({
                    success: false,
                    message: "This account has been banned by an administrator."
                });
            }

            if (!user.role) {

                return res.status(400).json({
                    success: false,
                    message: "User role could not be determined."
                });
            }

            res.json({
                success: true,
                user: {
                    userID: user.userID,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {

            console.error(
                "Authentication check error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to verify user."
            });
        }
    }
);

// ==================================================
// COMPLAINTS (STUDENT/TUTOR)
// ==================================================

app.post("/api/complaints", authenticateToken, async (req, res) => {

    const { reportedUserID, description } = req.body;

    if (req.user.role === "admin") {
        return res.status(403).json({ success: false, message: "Administrators cannot submit complaints." });
    }

    if (!reportedUserID || !description || !description.trim()) {
        return res.status(400).json({ success: false, message: "Reported user ID and complaint description are required." });
    }

    if (Number(reportedUserID) === req.user.userID) {
        return res.status(400).json({ success: false, message: "You cannot submit a complaint about yourself." });
    }

    try {
        const [result] = await db.execute(createComplaintSQL, [
            req.user.userID,
            Number(reportedUserID),
            description.trim()
        ]);

        res.status(201).json({
            success: true,
            message: "Complaint submitted for administrator review.",
            complaintID: result.insertId
        });
    } catch (error) {
        console.error("Complaint creation error:", error);
        res.status(500).json({ success: false, message: "Could not submit complaint. Check the reported user ID." });
    }
});

// ==================================================
// ADMINISTRATION
// ==================================================

app.get("/api/admin/overview", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(adminOverviewSQL);
        res.json({ success: true, overview: rows[0] });
    } catch (error) {
        console.error("Admin overview error:", error);
        res.status(500).json({ success: false, message: "Could not load admin overview. Run admin_mvp_migration.sql first." });
    }
});

app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await db.execute(adminUsersSQL);
        res.json({ success: true, users });
    } catch (error) {
        console.error("Admin users error:", error);
        res.status(500).json({ success: false, message: "Could not load users. Run admin_mvp_migration.sql first." });
    }
});

app.patch("/api/admin/users/:userID/ban", authenticateToken, requireAdmin, async (req, res) => {
    const userID = Number(req.params.userID);
    const { isBanned } = req.body;

    if (!Number.isInteger(userID) || typeof isBanned !== "boolean") {
        return res.status(400).json({ success: false, message: "A valid user ID and ban status are required." });
    }

    try {
        const [result] = await db.execute(isBanned ? banUserSQL : unbanUserSQL, [userID]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: isBanned ? "User banned." : "User unbanned." });
    } catch (error) {
        console.error("Ban update error:", error);
        res.status(500).json({ success: false, message: "Could not update user ban status." });
    }
});

app.get("/api/admin/complaints", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [complaints] = await db.execute(adminComplaintsSQL);
        res.json({ success: true, complaints });
    } catch (error) {
        console.error("Admin complaints error:", error);
        res.status(500).json({ success: false, message: "Could not load complaints. Run admin_mvp_migration.sql first." });
    }
});

app.patch("/api/admin/complaints/:complaintID/resolve", authenticateToken, requireAdmin, async (req, res) => {
    const complaintID = Number(req.params.complaintID);

    if (!Number.isInteger(complaintID)) {
        return res.status(400).json({ success: false, message: "A valid complaint ID is required." });
    }

    try {
        const [result] = await db.execute(resolveComplaintSQL, [complaintID]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Complaint not found." });
        }

        res.json({ success: true, message: "Complaint resolved." });
    } catch (error) {
        console.error("Complaint resolution error:", error);
        res.status(500).json({ success: false, message: "Could not resolve complaint." });
    }
});

// ==================================================
// FT1: BOOK A TUTOR / CANCEL / RESCHEDULE
// ==================================================

app.get("/api/subjects", async (req, res) => {
    try {
        const [subjects] = await db.execute(subjectsSQL);
        res.json({ success: true, subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load subjects." });
    }
});

app.get("/api/locations", (req, res) => {
    res.json({ success: true, locations: LOCATIONS });
});

app.get("/api/tutors/search", async (req, res) => {
    const subjectID = normalizeOptionalNumber(req.query.subjectID);
    const location = req.query.location || null;
    const teachingMode = req.query.teachingMode || null;
    const minRate = normalizeOptionalNumber(req.query.minRate);
    const maxRate = normalizeOptionalNumber(req.query.maxRate);
    const minRating = normalizeOptionalNumber(req.query.minRating);

    try {
        const [tutors] = await db.execute(searchTutorsSQL, [
            subjectID, subjectID, location, location, teachingMode, teachingMode,
            minRate, minRate, maxRate, maxRate, minRating, minRating
        ]);
        res.json({ success: true, tutors });
    } catch (error) {
        console.error("Tutor search error:", error);
        res.status(500).json({ success: false, message: "Could not search tutors." });
    }
});

app.get("/api/tutors/rankings", async (req, res) => {
    try {
        const [tutors] = await db.execute(rankTutorsSQL);
        res.json({ success: true, tutors });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load tutor rankings." });
    }
});

app.post("/api/bookings", authenticateToken, requireRole("student"), async (req, res) => {
    const { tutorID, subjectID, sessionDate, startTime, endTime, teachingMode } = req.body;
    const numericTutorID = Number(tutorID);
    const numericSubjectID = Number(subjectID);

    if (!Number.isInteger(numericTutorID) || !Number.isInteger(numericSubjectID) ||
        !sessionDate || !validTimeRange(startTime, endTime) ||
        !["ONLINE", "OFFLINE", "BOTH"].includes(teachingMode)) {
        return res.status(400).json({ success: false, message: "Valid tutor, subject, date, time range and teaching mode are required." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [subjectRows] = await connection.execute(tutorSubjectRateSQL, [numericTutorID, numericSubjectID]);

        if (subjectRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "This tutor does not teach the selected subject." });
        }

        const tutor = subjectRows[0];
        if (tutor.teachingMode !== "BOTH" && teachingMode !== tutor.teachingMode) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "The selected teaching mode is not offered by this tutor." });
        }

        const [availabilityRows] = await connection.execute(availabilityCheckSQL, [numericTutorID, sessionDate, startTime, endTime]);
        if (availabilityRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "The tutor is not available during this date and time." });
        }

        const [conflicts] = await connection.execute(bookingConflictSQL, [numericTutorID, sessionDate, endTime, startTime]);
        if (conflicts.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: "The tutor already has a conflicting booking." });
        }

        const [result] = await connection.execute(createBookingSQL, [
            startTime, endTime, tutor.hourlyRate, sessionDate, teachingMode,
            req.user.userID, numericTutorID, numericSubjectID
        ]);
        await connection.commit();
        res.status(201).json({ success: true, message: "Booking request created.", bookingID: result.insertId, agreedRate: tutor.hourlyRate });
    } catch (error) {
        await connection.rollback();
        console.error("Create booking error:", error);
        res.status(500).json({ success: false, message: "Could not create booking." });
    } finally {
        connection.release();
    }
});

app.get("/api/bookings/my", authenticateToken, async (req, res) => {
    if (!["student", "tutor"].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Student or tutor access is required." });
    }
    try {
        const sql = req.user.role === "student" ? studentBookingsSQL : tutorBookingsSQL;
        const [bookings] = await db.execute(sql, [req.user.userID]);
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load bookings." });
    }
});

app.patch("/api/bookings/:bookingID/cancel", authenticateToken, requireRole("student"), async (req, res) => {
    try {
        const [result] = await db.execute(cancelBookingSQL, [Number(req.params.bookingID), req.user.userID]);
        if (!result.affectedRows) return res.status(400).json({ success: false, message: "Only pending or confirmed bookings can be cancelled." });
        res.json({ success: true, message: "Booking cancelled." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not cancel booking." });
    }
});

app.patch("/api/bookings/:bookingID/reschedule", authenticateToken, requireRole("student"), async (req, res) => {
    const { sessionDate, startTime, endTime, teachingMode } = req.body;
    const bookingID = Number(req.params.bookingID);
    if (!Number.isInteger(bookingID) || !sessionDate || !validTimeRange(startTime, endTime) || !["ONLINE", "OFFLINE", "BOTH"].includes(teachingMode)) {
        return res.status(400).json({ success: false, message: "Valid date, time range and teaching mode are required." });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [bookings] = await connection.execute(bookingDetailsSQL, [bookingID, req.user.userID]);
        if (!bookings.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Booking not found." });
        }
        const booking = bookings[0];
        const [availability] = await connection.execute(availabilityCheckSQL, [booking.tutorID, sessionDate, startTime, endTime]);
        const [conflicts] = await connection.execute(rescheduleConflictSQL, [booking.tutorID, sessionDate, bookingID, endTime, startTime]);
        if (!availability.length || conflicts.length) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: "Tutor is unavailable or has a conflicting booking at the new time." });
        }
        const [result] = await connection.execute(rescheduleBookingSQL, [startTime, endTime, sessionDate, teachingMode, bookingID, req.user.userID]);
        if (!result.affectedRows) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Only pending or confirmed bookings can be rescheduled." });
        }
        await connection.commit();
        res.json({ success: true, message: "Booking rescheduled and returned to pending status." });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: "Could not reschedule booking." });
    } finally {
        connection.release();
    }
});

app.patch("/api/bookings/:bookingID/status", authenticateToken, requireRole("tutor"), async (req, res) => {
    const { status } = req.body;
    if (!["CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
        return res.status(400).json({ success: false, message: "Status must be CONFIRMED, COMPLETED or CANCELLED." });
    }
    try {
        const [result] = await db.execute(tutorUpdateBookingStatusSQL, [status, Number(req.params.bookingID), req.user.userID]);
        if (!result.affectedRows) return res.status(400).json({ success: false, message: "This booking cannot be updated." });
        res.json({ success: true, message: "Booking status updated." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not update booking status." });
    }
});

// ==================================================
// FT2: TUTOR EARNINGS, STATISTICS AND RANKING
// ==================================================

app.get("/api/tutor/statistics", authenticateToken, requireRole("tutor"), async (req, res) => {
    try {
        const [[overviewRows], [bySubject], [byMonth], [ratingRows]] = await Promise.all([
            db.execute(tutorOverviewSQL, [req.user.userID]),
            db.execute(earningsBySubjectSQL, [req.user.userID]),
            db.execute(earningsByMonthSQL, [req.user.userID]),
            db.execute(tutorRatingSQL, [req.user.userID])
        ]);
        res.json({ success: true, overview: overviewRows[0], bySubject, byMonth, rating: ratingRows[0] });
    } catch (error) {
        console.error("Tutor statistics error:", error);
        res.status(500).json({ success: false, message: "Could not load tutor statistics." });
    }
});

// ==================================================
// FT3: REVIEWS, REQUEST POSTS AND ADMIN MATCHING
// ==================================================

app.get("/api/reviews/my-bookings", authenticateToken, requireRole("student"), async (req, res) => {
    try {
        const [bookings] = await db.execute(myReviewableBookingsSQL, [req.user.userID]);
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load reviewable bookings." });
    }
});

app.post("/api/reviews", authenticateToken, requireRole("student"), async (req, res) => {
    const { bookingID, rating, comment } = req.body;
    const numericRating = Number(rating);
    if (!Number.isInteger(Number(bookingID)) || !Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, message: "A completed booking and rating from 1 to 5 are required." });
    }
    try {
        const [eligibleBookings] = await db.execute(eligibleBookingSQL, [Number(bookingID), req.user.userID]);
        if (!eligibleBookings.length) {
            return res.status(400).json({ success: false, message: "You can review only one of your completed bookings." });
        }
        const [result] = await db.execute(createReviewSQL, [Number(bookingID), comment || null, numericRating]);
        res.status(201).json({ success: true, message: "Review submitted.", reviewID: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not submit review." });
    }
});

function validateRequestBody(body) {
    const { subjectID, budget, prefStartTime, prefEndTime, prefDate, teachingMode } = body;
    if (!Number.isInteger(Number(subjectID)) || !prefDate || !validTimeRange(prefStartTime, prefEndTime) ||
        !["ONLINE", "OFFLINE", "BOTH"].includes(teachingMode)) {
        return null;
    }
    const parsedBudget = normalizeOptionalNumber(budget);
    if (budget !== undefined && budget !== "" && parsedBudget === null) return null;
    return { subjectID: Number(subjectID), budget: parsedBudget, prefStartTime, prefEndTime, prefDate, teachingMode };
}

app.post("/api/requests/tutor", authenticateToken, requireRole("student"), async (req, res) => {
    const request = validateRequestBody(req.body);
    if (!request) return res.status(400).json({ success: false, message: "Valid subject, date, time range and teaching mode are required." });
    try {
        const [result] = await db.execute(createTutorRequestSQL, [
            request.budget, request.prefStartTime, request.prefEndTime, request.prefDate,
            request.teachingMode, req.user.userID, request.subjectID
        ]);
        res.status(201).json({ success: true, message: "Tutor request posted.", requestID: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not post tutor request." });
    }
});

app.post("/api/requests/student", authenticateToken, requireRole("tutor"), async (req, res) => {
    const request = validateRequestBody(req.body);
    if (!request) return res.status(400).json({ success: false, message: "Valid subject, date, time range and teaching mode are required." });
    try {
        const [teaches] = await db.execute(tutorSubjectRateSQL, [req.user.userID, request.subjectID]);
        if (!teaches.length) {
            return res.status(400).json({ success: false, message: "You can post a student request only for a subject you teach." });
        }
        const [result] = await db.execute(createStudentRequestSQL, [
            req.user.userID, request.budget, request.prefStartTime, request.prefEndTime,
            request.prefDate, request.teachingMode, request.subjectID
        ]);
        res.status(201).json({ success: true, message: "Student request posted.", requestID: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not post student request. Ensure you teach the selected subject." });
    }
});

app.get("/api/admin/requests/tutors", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [requests] = await db.execute(openTutorRequestsSQL);
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load tutor requests." });
    }
});

app.get("/api/admin/requests/students", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [requests] = await db.execute(openStudentRequestsSQL);
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load student requests." });
    }
});

app.get("/api/requests/my", authenticateToken, async (req, res) => {
    if (!["student", "tutor"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Student or tutor access is required." });
    try {
        const sql = req.user.role === "student" ? studentTutorRequestsSQL : tutorStudentRequestsSQL;
        const [requests] = await db.execute(sql, [req.user.userID]);
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load your requests." });
    }
});

app.get("/api/requests/open/tutors", authenticateToken, requireRole("tutor"), async (req, res) => {
    try {
        const [requests] = await db.execute(openTutorRequestsSQL);
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load student tutor requests." });
    }
});

app.get("/api/requests/open/students", authenticateToken, requireRole("student"), async (req, res) => {
    try {
        const [requests] = await db.execute(openStudentRequestsSQL);
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load tutor student requests." });
    }
});

app.get("/api/admin/matches/tutors/:requestID", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [matches] = await db.execute(matchTutorsForRequestSQL, [Number(req.params.requestID)]);
        res.json({ success: true, matches });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not find matching tutors." });
    }
});

app.get("/api/admin/matches/students/:requestID", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [matches] = await db.execute(matchStudentsForRequestSQL, [Number(req.params.requestID)]);
        res.json({ success: true, matches });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not find matching students." });
    }
});

// ==================================================
// START SERVER
// ==================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Backend running on http://localhost:${PORT}`
    );
});
