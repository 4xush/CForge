import React from 'react';
import { cn } from '../../lib/utils';
import PropTypes from 'prop-types';

/**
 * Spinner component for loading states
 */
const Spinner = ({ size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-t-2 border-b-2'
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-purple-500", 
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};

export { Spinner };

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
}; 