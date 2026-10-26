import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../configs/supabase";
import styles from "./register.module.scss";

function Register() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must contain at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            if (data.session) {
                navigate("/");
            } else {
                setMessage(
                    "Registration successful. Check your email to confirm your account before logging in."
                );
            }
        } catch (error) {
            setError(error.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.register}>
            <h1>Create an account</h1>
            <p>Register to start shopping.</p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                />

                <label htmlFor="confirmPassword">
                    Confirm password
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                        setConfirmPassword(event.target.value)
                    }
                    minLength={6}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Register"}
                </button>
            </form>

            {error && <p role="alert">{error}</p>}
            {message && <p role="status">{message}</p>}

            <p>
                Already have an account?{" "}
                <Link to="/login">Log in</Link>
            </p>
        </main>
    );
}

export default Register;