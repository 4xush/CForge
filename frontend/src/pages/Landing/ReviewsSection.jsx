import { useState, useEffect } from 'react';
import { MessageCircle, Star, ThumbsUp, ArrowRight, Users, Quote } from 'lucide-react';
import ApiService from '../../services/ApiService';

const ReviewsSection = () => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ averageRating: '0.0', totalReviews: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await ApiService.get('/reviews', { limit: 6, sortBy: 'helpful' });
                const json = res.data;
                if (json.success) {
                    setReviews(json.data.reviews.slice(0, 3)); // Show top 3 reviews
                }
            } catch (err) {
                console.error('Error fetching reviews:', err);
                // Fallback data for demo
                setReviews([
                    {
                        id: 1,
                        user: "Alex Chen",
                        rating: 5,
                        message: "CForge has completely transformed how I track my coding progress. The community aspect is incredible!",
                        category: "Compliment",
                        helpful: 24,
                        date: "2 days ago"
                    },
                    {
                        id: 2,
                        user: "Sarah Kim",
                        rating: 5,
                        message: "Finally found a platform that brings visibility to my LeetCode grind. Love the room feature!",
                        category: "Feature Request",
                        helpful: 18,
                        date: "1 week ago"
                    },
                    {
                        id: 3,
                        user: "Mike Rodriguez",
                        rating: 4,
                        message: "Great for staying motivated during interview prep. The leaderboards are addictive!",
                        category: "UI/UX",
                        helpful: 15,
                        date: "2 weeks ago"
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        const fetchStats = async () => {
            try {
                const res = await ApiService.get('/reviews/stats');
                const json = res.data;
                if (json.success) {
                    setStats(json.data);
                }
            } catch (err) {
                console.error('Error fetching review stats:', err);
                // Keep default stats if API fails
            }
        };

        fetchReviews();
        fetchStats();
    }, []);

    const StarRating = ({ rating, disabled = true }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const categoryIcons = {
        'Feature Request': <MessageCircle className="w-4 h-4 text-blue-400" />,
        'UI/UX': <MessageCircle className="w-4 h-4 text-green-400" />,
        'Bug Report': <MessageCircle className="w-4 h-4 text-red-400" />,
        'Compliment': <Star className="w-4 h-4 text-purple-400" />,
    };

    return (
        <section id="reviews" className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-[#141B3F] to-[#0A0F23] relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-blue-900/5"></div>
            <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div className="container mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-12 sm:mb-16">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
                            <MessageCircle className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            What Our Community Says
                        </h2>
                    </div>
                    <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-light tracking-wide mb-8">
                        Join developers who are already using CForge to track their progress and connect with the community
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 sm:gap-12 mb-8">
                        <div className="flex flex-col items-center">
                            <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">{stats.averageRating}</div>
                            <StarRating rating={Math.round(parseFloat(stats.averageRating))} />
                            <div className="text-gray-500 text-sm mt-1">Average Rating</div>
                        </div>
                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent"></div>
                        <div className="flex flex-col items-center">
                            <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2">{stats.totalReviews}</div>
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <Users className="w-4 h-4" />
                                Total Reviews
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Grid */}
                <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                                    <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        reviews.map((review, index) => (
                            <div
                                key={review.id}
                                className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/70 hover:border-purple-500/30 transition-all duration-300 hover:scale-105"
                                style={{
                                    animationDelay: `${index * 100}ms`
                                }}
                            >
                                {/* Quote icon */}
                                <div className="flex justify-between items-start mb-4">
                                    <Quote className="w-6 h-6 text-purple-400/60" />
                                    <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700">
                                        {categoryIcons[review.category] || <MessageCircle className="w-3 h-3" />}
                                        {review.category}
                                    </div>
                                </div>

                                {/* Review content */}
                                <p className="text-gray-200 leading-relaxed mb-4 text-sm sm:text-base">
                                    "{review.message}"
                                </p>

                                {/* User info and rating */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {review.user[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white text-sm">{review.user}</div>
                                            <StarRating rating={review.rating} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <ThumbsUp className="w-3 h-3" />
                                        {review.helpful}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-700/30">
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                            Ready to Share Your Experience?
                        </h3>
                        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                            Join our community and help others discover the power of collaborative coding progress tracking
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="/reviews"
                                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Read All Reviews
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            <a
                                href="/signup"
                                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 border-2 border-purple-500 text-purple-400 rounded-full font-medium hover:bg-purple-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                Join CForge
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReviewsSection; 