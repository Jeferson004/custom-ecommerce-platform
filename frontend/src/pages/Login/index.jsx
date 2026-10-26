import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../configs/supabase";
import styles from "./login.module.scss";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            navigate("/");
        } catch (error) {
            setError(error.message || "Unable to log in.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.login}>
            <h1>Log in</h1>
            <p>Sign in to access your shopping cart.</p>

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
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Log in"}
                </button>
            </form>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <p>
                Don't have an account?{" "}
                <Link to="/register">Register</Link>
            </p>
        </main>
    );
}

export default Login;