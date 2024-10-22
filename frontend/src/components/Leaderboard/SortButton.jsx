import React from 'react';

const SortButtons = ({ sortBy, current, handleSort, label }) => (
    <button
        className={`px-3 py-1 rounded text-sm ${sortBy === current ? 'bg-gray-700' : 'bg-gray-800'}`}
        onClick={() => handleSort(current)}
    >
        {label}
    </button>
);
export default SortButtons;