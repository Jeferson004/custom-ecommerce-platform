import { forwardRef } from 'react';
import { useLocation, NavLink } from 'react-router-dom';

import LogoutButton from '../../Buttons/LogoutButton';
import styles from './adminSidebar.module.scss';

const AdminSidebar = forwardRef(function AdminSidebar({ isOpen, isMobile, onNavigate }, ref) {
    const location = useLocation();

    const isDashboardActive =
        location.pathname === '/admin' ||
        location.pathname === '/admin/' ||
        location.pathname === '/admin/dashboard';

    const navigation = [
        { label: 'Dashboard', path: '/admin' },
        { label: 'Products', path: '/admin/products' },
        { label: 'Inventory', path: '/admin/inventory' },
        { label: 'Transactions', path: '/admin/transactions' },
        { label: 'Orders', path: '/admin/orders' },
    ];

    return (
        <aside
            ref={ref}
            id="admin-sidebar"
            className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
            aria-hidden={isMobile && !isOpen}
            inert={isMobile && !isOpen}
            role={isMobile && isOpen ? 'dialog' : undefined}
            aria-modal={isMobile && isOpen ? true : undefined}
            aria-label="Admin navigation">
            <div className={styles.container}>
                <div className={styles.sidebarHeader}>
                    <h2>Lorem</h2>
                </div>

                <nav className={styles.navigation} aria-label="Administration">
                    <ul className={styles.list}>
                        {navigation.map((item) => {
                            const isActive =
                                item.path === '/admin'
                                    ? isDashboardActive
                                    : location.pathname.startsWith(item.path);

                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={onNavigate}
                                        className={isActive ? styles.activeLink : styles.navLink}
                                        aria-current={isActive ? 'page' : undefined}>
                                        {item.label}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className={styles.sidebarFooter}>
                    <LogoutButton className={styles.logoutButton} />
                </div>
            </div>
        </aside>
    );
});

export default AdminSidebar;
