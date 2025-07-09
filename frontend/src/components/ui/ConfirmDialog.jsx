import React from 'react';

const ConfirmDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    loading = false, 
    confirmButtonText = "Confirm",
    cancelButtonText = "Cancel"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-gray-200">{title}</h2>
                <p className="mb-6 text-gray-300">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelButtonText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
