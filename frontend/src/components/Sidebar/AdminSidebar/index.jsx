import { NavLink } from 'react-router-dom';
import styles from './adminSidebar.module.scss';

import LogoutButton from '../../Buttons/LogoutButton';

function AdminSidebar({ isOpen, onNavigate }) {
    const navigation = [
        {
            label: 'Dashboard',
            path: '/admin/dashboard',
        },
        {
            label: 'Products',
            path: '/admin/products',
        },
        {
            label: 'Inventory',
            path: '/admin/inventory',
        },
        {
            label: 'Transactions',
            path: '/admin/transactions',
        },
        {
            label: 'Orders',
            path: '/admin/orders',
        },
    ];

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.container}>
                <div className={styles.sidebarHeader}>
                    <h2>Lorem</h2>
                </div>

                <nav className={styles.navigation}>
                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                isActive ? styles.activeLink : styles.navLink
                            }>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <LogoutButton className={styles.logoutButton} />
                </div>
            </div>
        </aside>
    );
}

export default AdminSidebar;
