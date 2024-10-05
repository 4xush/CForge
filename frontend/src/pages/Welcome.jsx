import React, { useState } from 'react';
import { PlusCircle, Users } from 'lucide-react';
import axios from 'axios';

const CForgeHomepage = () => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    try {
      await axios.post('/api/rooms/create');
      // Redirect or update UI to show the created room
    } catch (error) {
      setError(error.response.data.message || 'Connection lost!');
    }
    setIsCreatingRoom(false);
  };

  const handleJoinRoom = async () => {
    setIsJoiningRoom(true);
    try {
      await axios.post('/api/rooms/join');
      // Redirect or update UI to show the joined room
    } catch (error) {
      setError(error.response.data.message || 'Connection lost');
    }
    setIsJoiningRoom(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-8">
      <header className="flex items-center mb-12">
        <div className="flex items-center space-x-2">
          <svg className="h-8 w-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <h1 className="text-3xl font-bold">CForge</h1>
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center">
        <h2 className="text-4xl font-bold mb-8 text-center">Welcome, User!</h2>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg flex items-center justify-center"
            onClick={handleCreateRoom}
            disabled={isCreatingRoom}
          >
            <PlusCircle className="mr-2" /> {isCreatingRoom ? 'Creating...' : 'Create Room'}
          </button>
          <button
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 px-8 rounded-lg flex items-center justify-center"
            onClick={handleJoinRoom}
            disabled={isJoiningRoom}
          >
            <Users className="mr-2" /> {isJoiningRoom ? 'Joining...' : 'Join Room'}
          </button>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-8 text-center">
            {error}
          </div>
        )}
      </main>
      <footer className="mt-12 text-gray-400 text-sm text-center">
        <p>&copy; 2024 CForge. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CForgeHomepage;
