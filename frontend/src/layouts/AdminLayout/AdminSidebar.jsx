import { NavLink } from 'react-router-dom';
import styles from './adminLayout.module.scss';

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
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        <h2>Lorem</h2>
      </div>

      <nav className={styles.navigation}>
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? styles.activeLink : styles.navLink)}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
