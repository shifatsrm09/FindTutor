const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();

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

const signupSQL = loadSQL("auth", "signup.sql");
const signupStudentSQL = loadSQL("auth", "signup_student.sql");
const signupTutorSQL = loadSQL("auth", "signup_tutor.sql");
const loginSQL = loadSQL("auth", "login.sql");
const meSQL = loadSQL("auth", "me.sql");
const adminOverviewSQL = loadSQL("admin", "overview.sql");
const adminUsersSQL = loadSQL("admin", "users.sql");
const banUserSQL = loadSQL("admin", "ban_user.sql");
const unbanUserSQL = loadSQL("admin", "unban_user.sql");
const adminComplaintsSQL = loadSQL("admin", "complaints.sql");
const resolveComplaintSQL = loadSQL("admin", "resolve_complaint.sql");
const createComplaintSQL = loadSQL("complaints", "create.sql");

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
                phone || null
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
// START SERVER
// ==================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Backend running on http://localhost:${PORT}`
    );
});
