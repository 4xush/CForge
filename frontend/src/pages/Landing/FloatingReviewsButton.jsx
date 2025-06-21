import { useState, useEffect } from 'react';
import { MessageCircle, Star, X } from 'lucide-react';
import ApiService from '../../services/ApiService';

const FloatingReviewsButton = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [stats, setStats] = useState({ averageRating: '0.0', totalReviews: 0 });

    useEffect(() => {
        // Fetch stats from API
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

        fetchStats();
    }, []);

    useEffect(() => {
        // Show the button after scrolling down a bit
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsVisible(scrollPosition > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToReviews = () => {
        const reviewsSection = document.getElementById('reviews');
        if (reviewsSection) {
            reviewsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Expanded state */}
            {isExpanded && (
                <div className="absolute bottom-16 right-0 mb-4">
                    <div className="bg-gray-800/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-900/20 w-80">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Community Reviews</h3>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold text-yellow-400">{stats.averageRating}</div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= Math.round(parseFloat(stats.averageRating))
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-600'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="text-gray-400 text-sm">
                                {stats.totalReviews} reviews
                            </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4">
                            See what our community thinks about CForge and share your experience
                        </p>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={scrollToReviews}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                            >
                                View Reviews
                            </button>
                            <button
                                onClick={() => window.location.href = '/reviews'}
                                className="px-4 py-2 border border-purple-500 text-purple-400 rounded-lg font-medium text-sm hover:bg-purple-500/20 transition-all duration-200"
                            >
                                Full Page
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main floating button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
                <MessageCircle className="w-6 h-6" />
                
                {/* Pulse animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-ping opacity-20"></div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Community Reviews
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
            </button>
        </div>
    );
};

export default FloatingReviewsButton; 