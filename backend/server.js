const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

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

// --------------------------------------------------
// SQL FILE LOADER
// --------------------------------------------------

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

// --------------------------------------------------
// DATABASE TEST
// --------------------------------------------------

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
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed.",
            error: error.message
        });
    }
});

// --------------------------------------------------
// SIGNUP
// --------------------------------------------------

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

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({
            success: false,
            message: "Full name, email, password and role are required."
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

        // Check existing email
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

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Insert USER
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

        // Insert subclass
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

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

app.post("/api/auth/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    try {

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

        if (!user.role) {

            return res.status(400).json({
                success: false,
                message: "User role could not be determined."
            });
        }

        res.json({
            success: true,
            message: "Login successful.",
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
            message: "Login failed.",
            error: error.message
        });
    }
});

// --------------------------------------------------
// SERVER
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Backend running on http://localhost:${PORT}`
    );
});