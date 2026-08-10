import React, { useState } from "react";

function Signup({ onLogin }) {

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        role: "student",
        institution: "",
        bio: "",
        exp_year: "",
        teachingMode: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Signup failed."
                );
            }

            setMessage(
                "Account created! You can now login."
            );

            setForm({
                fullName: "",
                email: "",
                password: "",
                phone: "",
                role: "student",
                institution: "",
                bio: "",
                exp_year: "",
                teachingMode: ""
            });

        } catch (error) {

            setError(error.message);

        } finally {

            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>

            <form
                onSubmit={handleSubmit}
                style={styles.form}
            >

                <h1>Find Tutor</h1>

                <h2>Create Account</h2>

                <input
                    name="fullName"
                    placeholder="Full Name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                />

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                <input
                    name="phone"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={handleChange}
                />

                <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                >
                    <option value="student">
                        Student
                    </option>

                    <option value="tutor">
                        Tutor
                    </option>
                </select>

                {form.role === "student" && (
                    <input
                        name="institution"
                        placeholder="Institution"
                        value={form.institution}
                        onChange={handleChange}
                    />
                )}

                {form.role === "tutor" && (
                    <>
                        <textarea
                            name="bio"
                            placeholder="Bio"
                            value={form.bio}
                            onChange={handleChange}
                        />

                        <input
                            name="exp_year"
                            type="number"
                            min="0"
                            placeholder="Years of Experience"
                            value={form.exp_year}
                            onChange={handleChange}
                        />

                        <select
                            name="teachingMode"
                            value={form.teachingMode}
                            onChange={handleChange}
                        >
                            <option value="">
                                Teaching Mode
                            </option>

                            <option value="ONLINE">
                                Online
                            </option>

                            <option value="OFFLINE">
                                Offline
                            </option>

                            <option value="BOTH">
                                Both
                            </option>
                        </select>
                    </>
                )}

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "Creating..."
                        : "Sign Up"}
                </button>

               {message && (
    <>
                <p style={styles.success}>
                    {message}
                </p>

                <button
                    type="button"
                    onClick={() => onLogin()}
                >
                    Go to Login
                </button>
            </>
                      )}

                {error && (
                    <p style={styles.error}>
                        {error}
                    </p>
                )}

            </form>

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

    form: {
        width: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "30px",
        background: "#1e1e1e",
        borderRadius: "12px"
    },

    success: {
        color: "#4ade80"
    },

    error: {
        color: "#f87171"
    }
};

export default Signup;