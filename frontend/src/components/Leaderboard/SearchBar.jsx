// components/Leaderboard/SearchBar.jsx
import React from 'react';
import { Search } from 'lucide-react';

export const SearchBar = ({ 
  showSearchInput,
  searchQuery,
  setSearchQuery,
  handleSearch,
  setShowSearchInput 
}) => {
  return showSearchInput ? (
    <form onSubmit={handleSearch} className="flex items-center">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search user..."
        className="bg-gray-800 px-3 py-1 rounded-l text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="bg-gray-800 px-3 py-1 rounded-r flex items-center text-sm hover:bg-gray-700 transition-colors"
      >
        <Search size={14} />
      </button>
    </form>
  ) : (
    <button
      onClick={() => setShowSearchInput(true)}
      className="bg-gray-800 px-3 py-1 rounded flex items-center text-sm hover:bg-gray-700 transition-colors"
    >
      <Search size={14} />
      <span className="ml-1">Search</span>
    </button>
  );
};
