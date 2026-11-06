import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import styles from './adminLayout.module.scss';

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} />

      {isSidebarOpen && (
        <button
          type="button"
          className={styles.sidebarOverlay}
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <div className={styles.mainContent}>
        <AdminHeader onMenuClick={toggleSidebar} />

        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
