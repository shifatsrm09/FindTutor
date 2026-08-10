const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
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

function loadSQL(fileName) {
    const filePath = path.join(
        __dirname,
        "queries",
        "auth",
        fileName
    );

    return fs.readFileSync(filePath, "utf8");
}

const signupSQL = loadSQL("signup.sql");
const signupStudentSQL = loadSQL("signup_student.sql");
const signupTutorSQL = loadSQL("signup_tutor.sql");
const loginSQL = loadSQL("login.sql");
const meSQL = loadSQL("me.sql");

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
        // Hash password
        // -------------------------------

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // -------------------------------
        // Insert USER
        // -------------------------------

        const [userResult] = await connection.execute(
            signupSQL,
            [
                fullName,
                email,
                hashedPassword,
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

        // -------------------------------
        // Check password
        // -------------------------------

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {

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

// ==================================================
// GET CURRENT USER
// ==================================================

app.get(
    "/api/auth/me",
    authenticateToken,
    async (req, res) => {

        try {

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
// START SERVER
// ==================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Backend running on http://localhost:${PORT}`
    );
});