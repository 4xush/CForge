import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-700">
                <div className="flex items-center text-red-500 mb-4">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                </div>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        {cancelText || "Cancel"}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        {confirmText || "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};