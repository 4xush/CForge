import PropTypes from 'prop-types';

const SortButtons = ({ sortBy, current, handleSort, label }) => (
    <button
        className={`px-3 py-1 rounded text-sm transition-colors ${sortBy === current ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
            }`}
        onClick={() => handleSort(current)}
    >
        {label}
    </button>
);
SortButtons.propTypes = {
    sortBy: PropTypes.string.isRequired,
    current: PropTypes.string.isRequired,
    handleSort: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
};

export default SortButtons;