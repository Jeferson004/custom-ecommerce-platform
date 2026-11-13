import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/Auths/useAuth';

function Header() {
    const { profile, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error.message);
        }
    }

    return (
        <header>
            <span>{profile?.name}</span>

            <button onClick={handleLogout}>Logout</button>
        </header>
    );
}

export default Header;
