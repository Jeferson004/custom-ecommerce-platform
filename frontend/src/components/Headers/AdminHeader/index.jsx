import styles from './adminHeader.module.scss';

function AdminHeader({ isOpen, onMenuClick, menuButtonRef }) {
    return (
        <header className={styles.header}>
            <button
                ref={menuButtonRef}
                type="button"
                className={`${styles.menuButton} ${isOpen ? styles.menuButtonOpen : ''}`}
                onClick={onMenuClick}
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isOpen}
                aria-controls="admin-sidebar"
                aria-haspopup="dialog"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            <h1>Lorem</h1>

            <div className={styles.headerActions}>
                <span>Administration</span>
            </div>
        </header>
    );
}

export default AdminHeader;
