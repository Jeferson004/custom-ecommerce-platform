import { useState } from 'react';

export function useToggle(initialValue = false) {
    const [isOpen, setIsOpen] = useState(initialValue);

    function toggle() {
        setIsOpen((prev) => !prev);
    }

    function open() {
        setIsOpen(true);
    }

    function close() {
        setIsOpen(false);
    }

    return {
        isOpen,
        toggle,
        open,
        close,
    };
}
