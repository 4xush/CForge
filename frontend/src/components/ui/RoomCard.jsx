import React from 'react';
import { Users, Lock, Unlock, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Card component for displaying room information
 */
const RoomCard = ({ room, className, ...props }) => {
  if (!room) return null;
  
  return (
    <Card
      className={cn(
        "bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors duration-300 flex flex-col",
        className
      )}
      {...props}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span className="text-xl font-bold text-white">{room.name}</span>
          {room.isPublic ? (
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Unlock className="mr-2 h-4 w-4" /> Public
            </Badge>
          ) : (
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              <Lock className="mr-2 h-4 w-4" /> Private
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-400 mb-4">
          {room.description || 'No description provided.'}
        </p>
        <div className="space-y-2">
          <div className="flex items-center text-gray-400">
            <Users className="mr-2 h-5 w-5" />
            <span>{room.members?.length || 0} / {room.maxMembers} Members</span>
            {room.members?.length === room.maxMembers && (
              <Badge variant="secondary" className="ml-2 bg-red-900/20 text-red-400">
                Full
              </Badge>
            )}
          </div>
          {room.createdAt && (
            <div className="flex items-center text-gray-400">
              <Calendar className="mr-2 h-5 w-5" />
              <span>Created {formatDate(room.createdAt)}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="mt-auto pt-4">
        <Link
          to={`/rooms/${room.roomId}/leaderboard`}
          className="w-full group"
        >
          <div className="relative flex items-center justify-center w-full overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-px">
            <div className="relative flex items-center justify-center w-full h-full px-6 py-3 bg-gray-800 rounded-lg group-hover:bg-transparent transition-all duration-300">
              <span className="text-white font-semibold group-hover:text-white transition-colors">
                Enter Room
              </span>
              <ArrowRight className="ml-2 h-5 w-5 text-white transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </CardFooter>
    </Card>
  );
};

export { RoomCard }; 