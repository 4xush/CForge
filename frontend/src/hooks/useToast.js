import { useState } from 'react';

const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message) => {
        const id = Math.random().toString(36).substring(7);
        setToasts([...toasts, { id, message }]);

        // Remove toast after a delay
        setTimeout(() => {
            setToasts((toasts) => toasts.filter((toast) => toast.id !== id));
        }, 3000); // Adjust duration as needed
    };

    return { toasts, addToast };
};

export default useToast;
