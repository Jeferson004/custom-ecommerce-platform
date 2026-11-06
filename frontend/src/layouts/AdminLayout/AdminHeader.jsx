import styles from './adminLayout.module.scss';

function AdminHeader({ onMenuClick }) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={onMenuClick}
        aria-label="Toggle navigation menu">
        ☰
      </button>

      <h1>Lorem</h1>

      <div className={styles.headerActions}>
        <span>Administration</span>
      </div>
    </header>
  );
}

export default AdminHeader;
