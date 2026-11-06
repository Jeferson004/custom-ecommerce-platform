import { Outlet } from 'react-router-dom';
import styles from './adminLayout.module.scss';
import AdminSidebar from './AdminSidebar';

function AdminLayout() {
  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
