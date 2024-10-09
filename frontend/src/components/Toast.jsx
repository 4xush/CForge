import React from 'react';
import { useToast } from '../hooks/useToast';

const Toast = () => {
    const { toasts } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`mb-2 p-4 rounded-md shadow-md ${toast.variant === 'success' ? 'bg-green-500' :
                        toast.variant === 'destructive' ? 'bg-red-500' : 'bg-gray-700'
                        } text-white`}
                >
                    <h3 className="font-bold">{toast.title}</h3>
                    <p>{toast.description}</p>
                </div>
            ))}
        </div>
    );
};

export default Toast;