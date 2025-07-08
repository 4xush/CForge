import { useState } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen,
  ExternalLink, 
  Bookmark, 
  BookmarkCheck,
  Star,
  Clock,
  Edit3,
  Trash2,
  Bell,
  Calendar
} from 'lucide-react';
import ProblemCard from './ProblemCard';
import Pagination from '../ui/Pagination';

const ProblemList = ({ 
  problems, 
  pagination, 
  filters, 
  onFilterChange, 
  onProblemUpdate, 
  onProblemDelete,
  onPageChange 
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e) => {
    onFilterChange({ search: e.target.value });
  };

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleSortChange = (sortBy) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFilterChange({ sortBy, sortOrder: newOrder });
  };

  const difficultyColors = {
    Easy: 'text-green-400',
    Medium: 'text-yellow-400',
    Hard: 'text-red-400'
  };

  const importanceColors = {
    low: 'text-gray-400',
    medium: 'text-blue-400',
    high: 'text-red-400'
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-1.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search problems..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-7 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-xs sm:text-base whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* Important Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Show
                </label>
                <select
                  value={filters.isImportant}
                  onChange={(e) => handleFilterChange('isImportant', e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs sm:text-base"
                >
                  <option value="">All Problems</option>
                  <option value="true">Important Only</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs sm:text-base"
                >
                  <option value="solvedAt">Solved Date</option>
                  <option value="createdAt">Added Date</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-0 text-xs text-gray-400">
        <span>
          Showing {pagination.count} of {pagination.totalProblems} problems
        </span>
        <span>
          Page {pagination.current} of {pagination.total}
        </span>
      </div>

      {/* Problems List */}
      <div className="space-y-2 sm:space-y-4">
        {problems.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-3 sm:p-8 text-center border border-gray-700">
            <BookOpen className="w-6 h-6 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2 sm:mb-4" />
            <h3 className="text-sm sm:text-lg font-medium text-gray-300 mb-1 sm:mb-2">
              No problems found
            </h3>
            <p className="text-gray-500 text-xs sm:text-base">
              {filters.search || filters.isImportant
                ? 'Try adjusting your filters or search terms'
                : 'Sync your recent LeetCode submissions to get started'}
            </p>
          </div>
        ) : (
          problems.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              onUpdate={onProblemUpdate}
              onDelete={onProblemDelete}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 1 && (
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default ProblemList;