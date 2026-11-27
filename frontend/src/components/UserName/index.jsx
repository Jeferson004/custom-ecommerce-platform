import { useAuth } from '../../hooks/useAuth';

function UserName({ className }) {
    const { profile } = useAuth();

    return <span className={className}>{profile?.name}</span>;
}

export default UserName;
