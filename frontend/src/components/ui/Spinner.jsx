import React from 'react';
import PropTypes from 'prop-types';

export const Spinner = ({ size = 'default', className = '', ...props }) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    default: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4'
  };

  return (
    <div 
      className={`inline-block rounded-full border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['small', 'default', 'large']),
  className: PropTypes.string
}; 