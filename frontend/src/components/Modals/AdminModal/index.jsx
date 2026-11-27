import styles from './adminModal.module.scss';

function AdminModal({
    fields = [],
    formAction,
    submitName = 'Submit',
    cancelName = 'Cancel',
    onCancel,
}) {
    return (
        <div className={styles.container}>
            <form action={formAction}>
                {fields.map((field) => (
                    <div key={field.name} className={styles.labelAndInput}>
                        <label htmlFor={field.name}>{field.label}</label>

                        {field.type === 'textarea' ? (
                            <textarea
                                id={field.name}
                                name={field.name}
                                placeholder={field.placeholder}
                                rows={field.rows || 4}
                            />
                        ) : (
                            <input
                                id={field.name}
                                name={field.name}
                                type={field.type}
                                placeholder={field.placeholder}
                            />
                        )}
                    </div>
                ))}

                <button type="submit">{submitName}</button>
                <button type="button" onClick={onCancel}>
                    {cancelName}
                </button>
            </form>
        </div>
    );
}

export default AdminModal;
