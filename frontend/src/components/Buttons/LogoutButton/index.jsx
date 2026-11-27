import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

function LogoutButton({ className }) {
    const { logout } = useAuth();
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
        <button type="button" className={className} onClick={handleLogout}>
            Logout
        </button>
    );
}

export default LogoutButton;
