import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '../../lib/utils';

/**
 * Room search component with search input, button, and results display
 */
const RoomSearch = ({ 
  onSearch, 
  onClearSearch,
  className,
  placeholder = "Search for public rooms..." 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const results = await onSearch(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setSearchError(err.message || 'Failed to search rooms');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    if (onClearSearch) {
      onClearSearch();
    }
  };

  const isSearchActive = searchResults.length > 0;

  return (
    <div className={cn("mb-8", className)}>
      <form onSubmit={handleSearch}>
        <div className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
          {isSearchActive && (
            <Button 
              type="button" 
              onClick={clearSearch}
              variant="outline"
            >
              Clear
            </Button>
          )}
        </div>
        {searchError && <p className="mt-2 text-red-400">{searchError}</p>}
        {isSearchActive && (
          <p className="mt-2 text-gray-400">
            Found {searchResults.length} public room(s) matching "{searchQuery}"
          </p>
        )}
      </form>
    </div>
  );
};

export { RoomSearch }; 