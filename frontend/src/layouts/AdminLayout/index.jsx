import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';

import AdminSidebar from '../../components/Sidebar/AdminSidebar';
import AdminHeader from '../../components/Headers/AdminHeader';
import { useToggle } from '../../hooks/useToggle';

import styles from './adminLayout.module.scss';

function AdminLayout() {
    const { isOpen, toggle, close } = useToggle();
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
    const sidebarRef = useRef(null);
    const menuButtonRef = useRef(null);
    const wasOpen = useRef(false);

    // Detect whether the layout is using the mobile sidebar.
    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');

        const handleChange = (event) => {
            setIsMobile(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    // Manage focus when opening and closing the mobile sidebar.
    useEffect(() => {
        if (isOpen && isMobile) {
            const firstFocusable = sidebarRef.current?.querySelector('a[href], button:not(:disabled)');

            firstFocusable?.focus();
            wasOpen.current = true;
        } else if (wasOpen.current) {
            menuButtonRef.current?.focus();
            wasOpen.current = false;
        }
    }, [isOpen, isMobile]);

    // Handle Escape and contain keyboard focus inside the open sidebar.
    useEffect(() => {
        if (!isOpen || !isMobile) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusableElements = sidebarRef.current?.querySelectorAll('a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])',);

            if (!focusableElements?.length) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isMobile, close]);

    return (
        <div className={styles.container}>
            <AdminSidebar ref={sidebarRef} isOpen={isOpen} isMobile={isMobile} onNavigate={close} />

            {isOpen && isMobile && (
                <button
                    type="button"
                    className={styles.sidebarOverlay}
                    onClick={close}
                    aria-label="Close sidebar"
                />
            )}

            <div className={styles.content}>
                <AdminHeader isOpen={isOpen} onMenuClick={toggle} menuButtonRef={menuButtonRef} />

                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
