import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToggle } from '../../../hooks/useToggle';
import styles from './customerHeader.module.scss';

function Header() {
    const location = useLocation();

    const isProductsActive =
        location.pathname === '/customer' ||
        location.pathname === '/customer/' ||
        location.pathname.startsWith('/customer/products/');

    const { isOpen, toggle, close } = useToggle();

    const { profile, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            close();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error.message);
        }
    }

    const navigation = [
        { label: 'Products', path: '/customer' },
        { label: 'Cart', path: '/customer/cart' },
        { label: 'Orders', path: '/customer/orders' },
        { label: 'Address', path: '/customer/address' },
    ];

    return (
        <header className={styles.header}>
            <nav className={styles.navbar}>
                <div className={styles.container}>
                    <button
                        type="button"
                        className={styles.menuToggle}
                        onClick={toggle}
                        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={isOpen}
                        aria-controls="customer-navigation">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <div
                        id="customer-navigation"
                        className={`${styles.navigation} ${isOpen ? styles.sidebarOpen : ''}`}>
                        <ul className={styles.list}>
                            {navigation.map((item) => {
                                const isActive =
                                    item.path === '/customer'
                                        ? isProductsActive
                                        : location.pathname === item.path;

                                return (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            onClick={close}
                                            className={isActive ? styles.activeLink : styles.links}>
                                            {item.label}
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>

                        <ul className={styles.list}>
                            <span hidden>{profile?.name}</span>
                            <li>
                                <button
                                    type="button"
                                    className={styles.logoutButton}
                                    onClick={handleLogout}>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;
