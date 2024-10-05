export const Alert = ({ children, variant = 'default', className = '' }) => (
    <div
        className={`p-4 mb-4 rounded-md ${variant === 'destructive' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            } ${className}`}
    >
        {children}
    </div>
);

export const AlertDescription = ({ children, className = '' }) => (
    <div className={`text-sm ${className}`}>{children}</div>
);