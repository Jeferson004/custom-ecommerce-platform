import { useEffect, useRef } from 'react';

export function useModalDialog({ onCancel, isBusy = false }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        const opener = document.activeElement;

        dialog.showModal();

        return () => {
            dialog.close();
            opener?.focus();
        };
    }, []);

    const handleCancel = (event) => {
        event.preventDefault(); // the parent closes it by unmounting
        if (!isBusy) onCancel?.();
    };

    return { dialogRef, handleCancel };
}
