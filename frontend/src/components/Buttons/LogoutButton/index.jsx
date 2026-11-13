import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/Auths/useAuth';

function LogoutButton({ className }) {
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
        <>
            <span hidden>{profile?.name}</span>
            <button className={className} onClick={handleLogout}>
                Logout
            </button>
        </>
    );
}

export default LogoutButton;
