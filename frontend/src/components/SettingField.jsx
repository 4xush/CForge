import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

const SettingField = ({
    icon,
    label,
    value,
    type = "text",
    placeholder = "",
    onEdit
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');

    useEffect(() => {
        setEditValue(value || '');
    }, [value]);

    const handleSubmit = () => {
        onEdit(editValue);
        setIsEditing(false);
    };

    const handleStartEditing = () => {
        setEditValue(value || '');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditValue(value || '');
        setIsEditing(false);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-gray-400">
                    {icon}
                    {label}
                </label>
                {!isEditing && (
                    <button
                        onClick={handleStartEditing}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                        Edit
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    {value || <span className="text-gray-500">Not specified</span>}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    {type === 'textarea' ? (
                        <textarea
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            placeholder={placeholder || label}
                            className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20"
                            rows={3}
                        />
                    ) : (
                        <input
                            type={type}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            placeholder={placeholder || label}
                            className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20"
                        />
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
export default SettingField;