export const Switch = ({ checked, onCheckedChange }) => (
    <div
        className={`w-14 h-7 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer ${checked ? 'bg-purple-600' : ''
            }`}
        onClick={() => onCheckedChange(!checked)}
    >
        <div
            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-7' : ''
                }`}
        />
    </div>
);
