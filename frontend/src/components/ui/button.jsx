import React from 'react';
import { cn } from '../../lib/utils';

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", disabled, children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-purple-600 text-white hover:bg-purple-700",
      secondary: "bg-gray-600 text-white hover:bg-gray-700",
      outline: "bg-transparent border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600",
      ghost: "bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      link: "bg-transparent text-purple-600 hover:underline p-0"
    };

    const sizeClasses = {
      default: "h-10 py-2 px-4",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6 text-lg",
      icon: "h-9 w-9 p-0"
    };

    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button }; 