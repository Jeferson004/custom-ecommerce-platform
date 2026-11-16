import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../configs/supabase';
import styles from './login.module.scss';

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw authError;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Unable to retrieve your account information.');
            }

            if (profile.role === 'admin' || profile.role === 'staff') {
                navigate('/admin', { replace: true });
            } else if (profile.role === 'customer') {
                navigate('/customer', { replace: true });
            } else {
                throw new Error('Your account has an invalid role.');
            }
        } catch (error) {
            setError(error.message || 'Unable to log in.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <form onSubmit={handleSubmit}>
                <div className={styles.headerText}>
                    <h1>Log in</h1>
                    <p>Sign in to access your shopping cart.</p>
                </div>

                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <div className={styles.labelAndInput}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div className={styles.labelAndInput}>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log in'}
                </button>

                <p>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
