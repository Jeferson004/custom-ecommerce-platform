import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/Sidebar/AdminSidebar';
import AdminHeader from '../../components/Headers/AdminHeader';
import { useToggle } from '../../hooks/useToggle';
import styles from './adminLayout.module.scss';

function AdminLayout() {
    const { isOpen, toggle, close } = useToggle();

    return (
        <div className={styles.container}>
            <AdminSidebar isOpen={isOpen} onNavigate={close} />

            {isOpen && (
                <button
                    type="button"
                    className={styles.sidebarOverlay}
                    onClick={close}
                    aria-label="Close sidebar"
                />
            )}

            <div className={styles.content}>
                <AdminHeader onMenuClick={toggle} />

                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
