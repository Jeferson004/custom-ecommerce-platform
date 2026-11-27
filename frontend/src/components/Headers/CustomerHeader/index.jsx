import { useLocation, NavLink } from 'react-router-dom';
import { useToggle } from '../../../hooks/useToggle';
import styles from './customerHeader.module.scss';
import LogoutButton from '../../Buttons/LogoutButton';

const navigation = [
    { label: 'Products', path: '/customer', activePrefix: '/customer/products/' },
    { label: 'Cart', path: '/customer/cart' },
    { label: 'Orders', path: '/customer/orders', activePrefix: '/customer/orders/' },
    { label: 'Address', path: '/customer/address' },
];

function isItemActive(pathname, { path, activePrefix }) {
    const current = pathname.replace(/\/$/, '') || '/';

    return current === path || (activePrefix ? pathname.startsWith(activePrefix) : false);
}

function Header() {
    const location = useLocation();
    const { isOpen, toggle, close } = useToggle();

    return (
        <header className={styles.header}>
            <nav className={styles.navbar}>
                <div className={styles.container}>
                    <button
                        type="button"
                        className={`${styles.menuToggle} ${isOpen ? styles.menuToggleOpen : ''}`}
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
                                const isActive = isItemActive(location.pathname, item);

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
                            <li>
                                <LogoutButton className={styles.logoutButton} />
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;
