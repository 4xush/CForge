import React from 'react';
import { Edit, Trash2, X } from 'lucide-react';

const ContextMenu = ({ onEdit, onDelete, onCancel }) => {
    return (
        <div className="relative right-0 mt-2 w-56 bg-gray-700 text-white rounded-lg shadow-2xl border border-gray-600 overflow-hidden z-50">
            <div className="py-1">
                <button
                    onClick={onEdit}
                    className="flex items-center px-4 py-3 text-sm hover:bg-gray-600 w-full text-left transition-colors duration-200"
                >
                    <Edit size={16} className="mr-3 text-blue-400" />
                    <span className="text-white">Edit Message</span>
                </button>
                <div className="border-t border-gray-600"></div>
                <button
                    onClick={onDelete}
                    className="flex items-center px-4 py-3 text-sm hover:bg-gray-600 w-full text-left transition-colors duration-200"
                >
                    <Trash2 size={16} className="mr-3 text-red-400" />
                    <span className="text-red-400">Delete Message</span>
                </button>
                <div className="border-t border-gray-600"></div>
                <button
                    onClick={onCancel}
                    className="flex items-center px-4 py-3 text-sm hover:bg-gray-600 w-full text-left transition-colors duration-200"
                >
                    <X size={16} className="mr-3 text-gray-400" />
                    <span className="text-gray-400">Cancel</span>
                </button>
            </div>
        </div>
    );
};

export default ContextMenu;