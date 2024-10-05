export const Button = ({ children, className = '', ...props }) => (
    <button
        className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 ${className}`}
        {...props}
    >
        {children}
    </button>
);