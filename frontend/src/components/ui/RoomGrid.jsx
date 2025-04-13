import React from 'react';
import { RoomCard } from './RoomCard';
import { cn } from '../../lib/utils';

/**
 * Grid component for displaying multiple room cards
 */
const RoomGrid = ({ 
  rooms = [], 
  emptyMessage = "No rooms found", 
  emptyDescription = "Try a different search term or create a new room",
  className,
  ...props 
}) => {
  if (!rooms.length) {
    return (
      <div className="text-center py-16 bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">{emptyMessage}</h2>
        <p className="text-gray-400 mb-6">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div 
      className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)} 
      {...props}
    >
      {rooms.map((room) => (
        <RoomCard key={room._id} room={room} />
      ))}
    </div>
  );
};

export { RoomGrid }; 