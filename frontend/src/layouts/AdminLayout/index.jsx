import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/Sidebar/AdminSidebar';
import AdminHeader from '../../components/Headers/AdminHeader';
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
        <div className={styles.container}>
            <AdminSidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} />

            {isSidebarOpen && (
                <button
                    type="button"
                    className={styles.sidebarOverlay}
                    onClick={closeSidebar}
                    aria-label="Close sidebar"
                />
            )}

            <div className={styles.content}>
                <AdminHeader onMenuClick={toggleSidebar} />

                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
