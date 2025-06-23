import { useState, useEffect, useCallback } from "react"
import { format, formatDistanceToNow, addSeconds } from "date-fns"
import {
  Calendar,
  Clock,
  ExternalLink,
  Play,
  Trophy,
  Code,
  Timer,
  RefreshCw,
  AlertCircle,
  Zap,
  Users,
  Award,
  Filter,
  ChevronDown,
  TrendingUp
} from "lucide-react"
import { toast } from "react-hot-toast"
import ApiService from "../services/ApiService"

const PLATFORMS = {
  codeforces: {
    name: "Codeforces",
    icon: Code,
    color: "from-blue-500 to-blue-600",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    getContestUrl: (contest) => `https://codeforces.com/contest/${contest.id}`,
  },
  leetcode: {
    name: "LeetCode",
    icon: Zap,
    color: "from-orange-500 to-orange-600",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    getContestUrl: (contest) => `https://leetcode.com/contest/${contest.titleSlug || contest.id}`,
  }
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache key for session storage
const CACHE_KEY = "contests_data";

// Countdown Timer Component
const CountdownTimer = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState("")
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const target = new Date(targetDate)
      const difference = target.getTime() - now.getTime()

      if (difference <= 0) {
        setTimeLeft("Contest Started!")
        setIsExpired(true)
        if (onExpire) onExpire()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onExpire])

  return (
    <div className={`flex items-center space-x-2 ${isExpired ? "text-emerald-400" : "text-purple-300"}`}>
      <Timer size={16} className="animate-pulse" />
      <span className="font-mono text-sm font-medium bg-black/20 px-2 py-1 rounded">{timeLeft}</span>
    </div>
  )
}

// Contest Card Component
const ContestCard = ({ contest, isOngoing = false }) => {
  const platform = PLATFORMS[contest.platform] || PLATFORMS.codeforces
  const PlatformIcon = platform.icon

  const startTime = new Date(contest.startTimeSeconds * 1000)
  const endTime = addSeconds(startTime, contest.durationSeconds)
  const duration = Math.floor(contest.durationSeconds / 3600)
  const durationMinutes = Math.floor((contest.durationSeconds % 3600) / 60)

  const handleJoinContest = () => {
    // Log analytics
    // console.log(`User clicked on contest: ${contest.name} (${contest.platform})`)

    const contestUrl = platform.getContestUrl(contest)
    if (contestUrl) {
      window.open(contestUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border ${platform.borderColor} hover:border-purple-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20`}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent rounded-xl"></div>

      {/* Live indicator for ongoing contests */}
      {isOngoing && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
            LIVE
          </div>
        </div>
      )}

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${platform.color} shadow-lg`}>
              <PlatformIcon size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-purple-200 transition-colors">
                {contest.name}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${platform.textColor} ${platform.bgColor} mt-2`}>
                {platform.name}
              </span>
            </div>
          </div>
        </div>

        {/* Contest Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-2 text-slate-300">
            <Calendar size={16} className="text-purple-400" />
            <span className="text-sm">{format(startTime, "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Clock size={16} className="text-purple-400" />
            <span className="text-sm">
              {format(startTime, "HH:mm")} ({duration}h {durationMinutes}m)
            </span>
          </div>
          {contest.participants && contest.participants > 0 && (
            <div className="flex items-center space-x-2 text-slate-300">
              <Users size={16} className="text-purple-400" />
              <span className="text-sm">{contest.participants.toLocaleString()} participants</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-slate-300">
            <Award size={16} className="text-purple-400" />
            <span className="text-sm">{isOngoing ? "In Progress" : "Scheduled"}</span>
          </div>
        </div>

        {/* Status and Action */}
        <div className="flex items-center justify-between">
          {isOngoing ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  Ends {formatDistanceToNow(endTime, { addSuffix: true })}
                </span>
              </div>
            </div>
          ) : (
            <CountdownTimer
              targetDate={startTime}
              onExpire={() => window.location.reload()}
            />
          )}

          <button
            onClick={handleJoinContest}
            className={`group/btn px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${isOngoing
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25"
              : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25"
              } hover:scale-105`}
          >
            {isOngoing ? (
              <>
                <Play size={16} className="group-hover/btn:animate-pulse" />
                <span>Join Now</span>
              </>
            ) : (
              <>
                <ExternalLink size={16} className="group-hover/btn:rotate-12 transition-transform" />
                <span>View Details</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Platform Filter Component
const PlatformFilter = ({ selectedPlatforms, onPlatformToggle }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2 text-white hover:border-purple-500/50 transition-all duration-300"
      >
        <Filter size={16} className="text-purple-400" />
        <span>Filter Platforms</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl z-50 min-w-[200px]">
          <div className="p-3">
            {Object.entries(PLATFORMS).map(([key, platform]) => {
              const PlatformIcon = platform.icon
              const isSelected = selectedPlatforms.includes(key)

              return (
                <button
                  key={key}
                  onClick={() => onPlatformToggle(key)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 mb-1 rounded-lg text-sm font-medium transition-all ${isSelected
                    ? `bg-gradient-to-r ${platform.color} text-white`
                    : "text-slate-300 hover:bg-slate-700/50"
                    }`}
                >
                  <PlatformIcon size={16} />
                  <span>{platform.name}</span>
                  {isSelected && <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Stats Component
const StatsComponent = ({ contests }) => {
  const totalOngoing = contests.ongoing.length
  const totalUpcoming = contests.upcoming.length
  const totalParticipants = contests.ongoing.reduce((sum, contest) => sum + (contest.participants || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
            <Play size={20} className="sm:text-[24px] text-white" />
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm">Ongoing Contests</p>
            <p className="text-lg sm:text-2xl font-bold text-white">{totalOngoing}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Calendar size={20} className="sm:text-[24px] text-white" />
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm">Upcoming Contests</p>
            <p className="text-lg sm:text-2xl font-bold text-white">{totalUpcoming}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-600/10 to-orange-800/10 backdrop-blur-sm border border-orange-500/20 rounded-xl p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
            <TrendingUp size={20} className="sm:text-[24px] text-white" />
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm">Active Participants</p>
            <p className="text-lg sm:text-2xl font-bold text-white">{totalParticipants.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Contests Page Component
const ContestsPage = () => {
  const [contests, setContests] = useState({ ongoing: [], upcoming: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedPlatforms, setSelectedPlatforms] = useState(Object.keys(PLATFORMS))
  const [notes, setNotes] = useState([])

  const getCachedData = () => {
    try {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();

        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error("Error reading from cache:", error);
    }
    return null;
  };

  const setCachedData = (data) => {
    try {
      const cacheData = {
        data,
        timestamp: new Date().getTime()
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error writing to cache:", error);
    }
  };

  const fetchContests = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setContests(cachedData.contests);
          setLastUpdated(new Date(cachedData.timestamp));
          setNotes(cachedData.notes || []);
          setLoading(false);
          return;
        }
      }

      // Fetch from API if no cache or force refresh
      const response = await ApiService.get("/contests/all");

      const newData = {
        ongoing: response.data.ongoing || [],
        upcoming: response.data.upcoming || [],
      };

      // Update state
      setContests(newData);
      setLastUpdated(new Date());
      setNotes(response.data.notes || []);

      // Cache the new data
      setCachedData({
        contests: newData,
        timestamp: new Date().getTime(),
        notes: response.data.notes || []
      });

      // Show errors as toast notifications if any
      if (response.data.errors && response.data.errors.length > 0) {
        toast.error(`Some platforms failed to load: ${response.data.errors.join(", ")}`, {
          duration: 5000,
        });
      }

      // Show notes as info notifications
      if (response.data.notes && response.data.notes.length > 0) {
        response.data.notes.forEach((note) => {
          toast(note, { duration: 3000, icon: "ℹ️" });
        });
      }
    } catch (err) {
      console.error("Error fetching contests:", err);
      setError("Failed to load contests. Please try again later.");
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const filteredContests = {
    ongoing: contests.ongoing.filter(contest => selectedPlatforms.includes(contest.platform)),
    upcoming: contests.upcoming.filter(contest => selectedPlatforms.includes(contest.platform)),
  }

  useEffect(() => {
    fetchContests();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchContests(true), CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchContests]);

  if (loading && contests.ongoing.length === 0 && contests.upcoming.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-6" />
              <p className="text-slate-300 text-lg">Loading contests...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && contests.ongoing.length === 0 && contests.upcoming.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-6" />
              <p className="text-red-400 mb-6 text-lg">{error}</p>
              <button
                onClick={fetchContests}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center mx-auto space-x-2 hover:scale-105"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent flex items-center">
                <Trophy className="mr-3 sm:mr-4 text-purple-400" size={32} />
                Contest Central
              </h1>
              <p className="text-slate-400 mt-2 sm:mt-3 text-base sm:text-lg max-w-2xl">
                Your ultimate destination for competitive programming contests. Track live competitions,
                upcoming events, and never miss a coding challenge.
              </p>
              {notes.length > 0 && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-amber-400 text-xs sm:text-sm">
                    ℹ️ Some contest data may be estimated due to API limitations
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-row items-center space-x-2 sm:space-x-4">
              {lastUpdated && (
                <p className="text-slate-400 text-xs sm:text-sm">
                  Last updated: {format(lastUpdated, "HH:mm")}
                </p>
              )}
              <button
                onClick={fetchContests}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 hover:scale-105 shadow-lg hover:shadow-purple-500/25 text-xs sm:text-base"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-2 sm:px-6 py-6 sm:py-12">
        {/* Stats */}
        <StatsComponent contests={contests} />

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <PlatformFilter
            selectedPlatforms={selectedPlatforms}
            onPlatformToggle={handlePlatformToggle}
          />

          {/* Tabs */}
          <div className="flex bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-1 w-full sm:w-auto mt-3 sm:mt-0">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`flex items-center justify-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-md font-semibold text-xs sm:text-sm transition-all duration-300 w-1/2 sm:w-auto ${activeTab === 'ongoing'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Play size={16} />
              <span>Live ({filteredContests.ongoing.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center justify-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-md font-semibold text-xs sm:text-sm transition-all duration-300 w-1/2 sm:w-auto ${activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Calendar size={16} />
              <span>Upcoming ({filteredContests.upcoming.length})</span>
            </button>
          </div>
        </div>

        {/* Contest Grid */}
        <div className="transition-all duration-500">
          {activeTab === 'ongoing' && (
            <>
              {filteredContests.ongoing.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
                  {filteredContests.ongoing.map((contest) => (
                    <ContestCard
                      key={`${contest.platform}-${contest.id}`}
                      contest={contest}
                      isOngoing={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 sm:py-20">
                  <div className="bg-slate-800/30 backdrop-blur-sm rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center m-auto mb-4 sm:mb-6">
                    <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-slate-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">No Live Contests</h3>
                  <p className="text-slate-400 mb-4 sm:mb-6">Check back soon or explore upcoming contests!</p>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 text-xs sm:text-base"
                  >
                    View Upcoming Contests
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'upcoming' && (
            <>
              {filteredContests.upcoming.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
                  {filteredContests.upcoming.map((contest) => (
                    <ContestCard
                      key={`${contest.platform}-${contest.id}`}
                      contest={contest}
                      isOngoing={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 sm:py-20">
                  <div className="bg-slate-800/30 backdrop-blur-sm rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center m-auto mb-4 sm:mb-6">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-slate-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">No Upcoming Contests</h3>
                  <p className="text-slate-400">All contests are currently live or completed.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default ContestsPage