// components/Card.jsx
export const Card = ({ children, className = '' }) => (
    <div className={`bg-white shadow-md rounded-lg ${className}`}>{children}</div>
  );
  
  export const CardHeader = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>
  );
  
  export const CardContent = ({ children, className = '' }) => (
    <div className={`p-6 ${className}`}>{children}</div>
  );
