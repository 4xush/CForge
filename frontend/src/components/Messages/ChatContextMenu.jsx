import React from 'react';
import { Edit, Trash2, X } from 'lucide-react';

const ContextMenu = ({ onEdit, onDelete, onCancel }) => {
    return (
        <div className="relative right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
            <div className="py-1">
                <button
                    onClick={onEdit}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                    <Edit size={16} className="mr-2" /> Edit
                </button>
                <button
                    onClick={onDelete}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                >
                    <Trash2 size={16} className="mr-2" /> Delete
                </button>
                <button
                    onClick={onCancel}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                    <X size={16} className="mr-2" /> Cancel
                </button>
            </div>
        </div>
    );
};

export default ContextMenu;
