import { useState, useEffect } from 'react';
import { MessageCircle, Send, Star, ThumbsUp, Lightbulb, AlertTriangle, Filter, ChevronDown, User, Calendar } from 'lucide-react';
import ApiService from '../services/ApiService';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import useMyReview from '../hooks/useMyReview';
import { Footer } from './Landing/NavBar';

const categoryOptions = [
    { label: 'Feature Request', value: 'Feature Request', icon: <Lightbulb className="w-4 h-4 text-yellow-400" /> },
    { label: 'UI/UX', value: 'UI/UX', icon: <AlertTriangle className="w-4 h-4 text-orange-400" /> },
    { label: 'Bug Report', value: 'Bug Report', icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
    { label: 'Compliment', value: 'Compliment', icon: <Star className="w-4 h-4 text-purple-400" /> },
];

const StarRating = ({ rating, onRatingChange, disabled = false }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !disabled && onRatingChange && onRatingChange(star)}
                    disabled={disabled}
                    className={`transition-colors ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                >
                    <Star
                        className={`w-5 h-5 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600 hover:text-yellow-400'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};
StarRating.propTypes = {
    rating: PropTypes.number.isRequired,
    onRatingChange: PropTypes.func,
    disabled: PropTypes.bool,
};

export default function ReviewsPage({ isAuthUser = false }) {
    const [review, setReview] = useState('');
    const [category, setCategory] = useState(categoryOptions[0].value);
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ averageRating: '0.0', totalReviews: 0 });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const { myReview, setMyReview } = useMyReview(isAuthUser);
    const [editMode, setEditMode] = useState(false);
    const [helpfulByMe, setHelpfulByMe] = useState({}); // { [reviewId]: true/false }

    // Fetch reviews and stats
    const fetchReviews = async (paramsOverride = {}) => {
        setLoading(true);
        try {
            const params = {
                category: filterCategory,
                sortBy,
                page,
                limit: 10,
                ...paramsOverride,
            };
            const res = await ApiService.get('/reviews', params);
            const json = res.data;
            if (!json.success) throw new Error('Failed to fetch reviews');
            setReviews(json.data.reviews);
            setPagination(json.data.pagination);
            setStats(json.data.stats);
            // Set helpfulByMe state from backend if available, else fallback to localStorage
            const localHelpful = JSON.parse(localStorage.getItem('helpfulReviewIds') || '[]');
            const newHelpfulByMe = {};
            json.data.reviews.forEach(r => {
                // If backend returns isMarkedHelpful, use it, else fallback to localStorage
                newHelpfulByMe[r.id] = r.isMarkedHelpful !== undefined ? r.isMarkedHelpful : localHelpful.includes(r.id);
            });
            setHelpfulByMe(newHelpfulByMe);
        } catch (err) {
            toast.error(err.message || 'Error fetching reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [filterCategory, sortBy, page]);

    // Submit review
    const handleSubmit = async () => {
        if (!isAuthUser || !review.trim()) return;
        setSubmitting(true);
        try {
            await ApiService.post('/reviews', {
                message: review,
                category,
                rating,
            });
            setSubmitted(true);
            setReview('');
            setCategory(categoryOptions[0].value);
            setRating(5);
            setTimeout(() => setSubmitted(false), 3000);
            setPage(1);
            fetchReviews({ page: 1 }); // Immediately refresh reviews after submit
            toast.success('Review submitted!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error submitting review');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit review handler
    const handleEdit = () => {
        if (!myReview) return;
        setReview(myReview.message);
        setCategory(myReview.category);
        setRating(myReview.rating);
        setEditMode(true);
    };

    // Update review handler
    const handleUpdate = async () => {
        setSubmitting(true);
        try {
            await ApiService.put('/reviews/my-review', {
                message: review,
                category,
                rating,
            });
            setEditMode(false);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
            setPage(1);
            toast.success('Review updated!');
            setMyReview({ ...myReview, message: review, category, rating });
            window.location.reload(); // Refresh the page to get the latest reviews
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error updating review');
        } finally {
            setSubmitting(false);
        }
    };

    // Helpful vote
    const handleHelpful = async (id) => {
        if (!isAuthUser) return toast.info('Sign in to vote helpful!');
        try {
            const res = await ApiService.put(`/reviews/${id}/helpful`);
            // Update local state and localStorage
            setReviews(reviews =>
                reviews.map(r =>
                    r.id === id
                        ? { ...r, helpful: res.data.data.helpful }
                        : r
                )
            );
            setHelpfulByMe(prev => ({ ...prev, [id]: res.data.data.isMarkedHelpful }));
            // Update localStorage for persistence
            let localHelpful = JSON.parse(localStorage.getItem('helpfulReviewIds') || '[]');
            if (res.data.data.isMarkedHelpful) {
                if (!localHelpful.includes(id)) localHelpful.push(id);
            } else {
                localHelpful = localHelpful.filter(x => x !== id);
            }
            localStorage.setItem('helpfulReviewIds', JSON.stringify(localHelpful));
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error marking helpful');
        }
    };

    // Use pagination and loading in the UI
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white font-sans">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <MessageCircle className="w-8 h-8 sm:w-8 sm:h-8 text-purple-400" />
                        <h1 className="text-2xl sm:text-3xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            User Reviews
                        </h1>
                    </div>
                    {/* Minimal stats row */}
                    <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-gray-400 font-medium mb-2">
                        <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="font-semibold text-white">{stats.averageRating}</span>
                            <span>Avg Rating</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4 text-purple-400" />
                            <span className="font-semibold text-white">{stats.totalReviews}</span>
                            <span>Reviews</span>
                        </span>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
                        Explore user feedback on CForge and add your own{' '}
                        <span style={{ fontFamily: 'Playfair Display, serif', textTransform: 'uppercase', fontWeight: 600, color: '#e0c3fc', fontStyle: 'italic', letterSpacing: '0.04em', display: 'inline' }}>
                            EXPERIENCE
                        </span>
                        .
                    </p>
                </div>

                {/* Reviews Section - Main content for everyone */}
                <div className="max-w-6xl mx-auto">
                    {/* Compact Sign-in Banner for Public Users */}
                    {!isAuthUser && (
                        <div className="mb-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-700/30">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                                    <div>
                                        <h3 className="font-semibold text-white text-sm sm:text-base">Share Your Experience</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm">Join users and share your review</p>
                                    </div>
                                </div>
                                <a
                                    href="/login"
                                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-md transition-all duration-200 text-xs sm:text-sm"
                                >
                                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Sign In
                                </a>
                            </div>
                        </div>
                    )}

                    <div className={`grid gap-6 sm:gap-8 ${isAuthUser ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                        {/* Review Submission Form - Only for authenticated users */}
                        {isAuthUser && (
                            <div className="lg:col-span-1">
                                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-700/50 sticky top-8">
                                    <h2 className="text-lg sm:text-xl font-bold mb-4 text-purple-300">{myReview && !editMode ? 'Your Review' : editMode ? 'Edit Your Review' : 'Share Your Review'}</h2>
                                    <div className="space-y-3 sm:space-y-4">
                                        {myReview && !editMode ? (
                                            <>
                                                <div className="mb-2">
                                                    <StarRating rating={myReview.rating} disabled />
                                                    <div className="text-xs text-gray-400 mt-1">{myReview.category}</div>
                                                    <div className="text-gray-200 mt-2 text-sm sm:text-base">{myReview.message}</div>
                                                </div>
                                                <button
                                                    onClick={handleEdit}
                                                    className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-md transition-all duration-200 text-sm sm:text-base"
                                                >
                                                    Edit Review
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-semibold mb-2">Overall Rating</label>
                                                    <StarRating rating={rating} onRatingChange={setRating} />
                                                </div>

                                                <div>
                                                    <label className="block text-xs sm:text-sm font-semibold mb-2">Category</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {categoryOptions.map(opt => (
                                                            <button
                                                                type="button"
                                                                key={opt.value}
                                                                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${category === opt.value
                                                                    ? 'bg-purple-700 border-purple-500 text-white shadow-lg'
                                                                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                                                                    }`}
                                                                onClick={() => setCategory(opt.value)}
                                                                disabled={submitting}
                                                            >
                                                                {opt.icon}
                                                                <span className="text-xs sm:text-sm">{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs sm:text-sm font-semibold mb-2">Your Review</label>
                                                    <textarea
                                                        className="w-full rounded-lg bg-gray-900 border border-gray-700 p-3 text-white resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm min-h-[80px] sm:min-h-[100px] transition-all duration-200"
                                                        placeholder="Share your experience with CForge..."
                                                        value={review}
                                                        onChange={e => setReview(e.target.value)}
                                                        maxLength={500}
                                                        disabled={submitting}
                                                    />
                                                    <div className="text-xs text-gray-500 mt-1">{review.length}/500</div>
                                                </div>

                                                <button
                                                    onClick={editMode ? handleUpdate : handleSubmit}
                                                    className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
                                                    disabled={submitting || !review.trim()}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Send className="animate-bounce w-3 h-3 sm:w-4 sm:h-4" />
                                                            {editMode ? 'Updating...' : 'Submitting...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            {editMode ? 'Update Review' : 'Submit Review'}
                                                        </>
                                                    )}
                                                </button>
                                                {editMode && (
                                                    <button
                                                        onClick={() => setEditMode(false)}
                                                        className="w-full mt-2 px-4 sm:px-5 py-2 rounded-lg bg-gray-700 text-white font-medium text-sm"
                                                        disabled={submitting}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {submitted && (
                                            <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-center text-xs sm:text-sm">
                                                Thank you for your review! 🎉
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviews Section */}
                        <div className={`${isAuthUser ? 'lg:col-span-2' : ''}`}>
                            {/* Filters */}
                            <div className="mb-6">
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition-all duration-200 text-xs sm:text-sm"
                                    >
                                        <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                                        Filters
                                        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                    </button>

                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-3 sm:px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="helpful">Most Helpful</option>
                                    </select>
                                </div>

                                {showFilters && (
                                    <div className="flex flex-wrap gap-2 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                        <button
                                            onClick={() => setFilterCategory('All')}
                                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${filterCategory === 'All'
                                                ? 'bg-purple-700 border-purple-500 text-white'
                                                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
                                                }`}
                                        >
                                            All Categories
                                        </button>
                                        {categoryOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setFilterCategory(opt.value)}
                                                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${filterCategory === opt.value
                                                    ? 'bg-purple-700 border-purple-500 text-white'
                                                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
                                                    }`}
                                            >
                                                {opt.icon}
                                                <span className="text-xs">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-3 sm:space-y-4">
                                {loading ? (
                                    <div className="text-center py-8 sm:py-12 text-gray-400 text-sm sm:text-base">Loading reviews...</div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-8 sm:py-12 text-gray-500">
                                        <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-sm sm:text-base">No reviews found for the selected category.</p>
                                    </div>
                                ) : (
                                    reviews.map(review => (
                                        <div
                                            key={review.id}
                                            className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6 hover:bg-gray-800/90 transition-all duration-200 group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                                        {review.user[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-white text-sm sm:text-base">{review.user}</span>
                                                            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700">
                                                                {review.icon}
                                                                <span className="text-xs">{review.category}</span>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <StarRating rating={review.rating} disabled />
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {review.date}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-gray-200 leading-relaxed mb-4 text-sm sm:text-base">{review.message}</p>

                                            <div className="flex items-center justify-between">
                                                <button
                                                    className={`flex items-center gap-1 text-xs transition-colors ${
                                                        helpfulByMe[review.id]
                                                            ? 'text-purple-400 font-bold'
                                                            : 'text-gray-500 hover:text-purple-400'
                                                    }`}
                                                    onClick={() => handleHelpful(review.id)}
                                                    disabled={!isAuthUser}
                                                >
                                                    <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    Helpful ({review.helpful})
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {/* Pagination Controls */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center mt-6 sm:mt-8 gap-2">
                                    <button
                                        className="px-2 sm:px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 text-xs sm:text-sm"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page <= 1}
                                    >
                                        Prev
                                    </button>
                                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>
                                    <button
                                        className="px-2 sm:px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 text-xs sm:text-sm"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= pagination.totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
ReviewsPage.propTypes = {
    isAuthUser: PropTypes.bool,
};