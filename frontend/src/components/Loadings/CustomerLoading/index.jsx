import styles from './customerLoading.module.scss'

function CustomerLoading({ text = 'Loading...' }) {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.spinner}></div>
                <p className={styles.text}>{text}</p>
            </div>
        </div>
    )
}

export default CustomerLoading;