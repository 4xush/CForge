import { useEffect } from 'react';
import { Users, Lock, Unlock, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import InviteModal from '../components/InviteRoomJoin/InviteModal';
import { useRoomContext } from '../context/RoomContext';

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const RoomComponent = () => {
    const { rooms, loading, error, refreshRoomList } = useRoomContext();

    useEffect(() => {
        refreshRoomList();
    }, [refreshRoomList]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 text-red-500 bg-gray-900">{error}</div>
        );
    }

    return (
        <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 bg-gray-900 min-h-screen">
            <InviteModal />
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 sm:mb-4">Your Rooms</h1>
                <p className="text-gray-400 text-sm sm:text-base">Explore and manage your collaborative spaces</p>
            </div>

            {rooms.length === 0 ? (
                <div className="text-center py-10 sm:py-16 bg-gray-800 rounded-lg w-full sm:w-1/2 mx-auto">
                    <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">No Rooms Yet</h2>
                    <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Start collaborating by creating or joining a room</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {rooms.map((room) => (
                        <Card
                            key={room._id}
                            className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors duration-300 flex flex-col"
                        >
                            <CardHeader className="pb-1 sm:pb-2">
                                <CardTitle className="flex justify-between items-center">
                                    <span className="text-base sm:text-xl font-bold text-white">{room.name}</span>
                                    {room.isPublic ? (
                                        <Badge variant="outline" className="text-green-400 border-green-400 text-xs sm:text-base">
                                            <Unlock className="mr-1 sm:mr-2 h-4 w-4" /> Public
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-purple-400 border-purple-400 text-xs sm:text-base">
                                            <Lock className="mr-1 sm:mr-2 h-4 w-4" /> Private
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400 mb-2 sm:mb-4 text-xs sm:text-base">
                                    {room.description || 'No description provided.'}
                                </p>
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center text-gray-400 text-xs sm:text-base">
                                        <Users className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>{room.members?.length || 0} / {room.maxMembers} Members</span>
                                        {room.members?.length === room.maxMembers && (
                                            <Badge variant="secondary" className="ml-1 sm:ml-2 bg-red-900/20 text-red-400 text-xs sm:text-base">
                                                Full
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center text-gray-400 text-xs sm:text-base">
                                        <Calendar className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>Created {formatDate(room.createdAt)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="mt-auto pt-2 sm:pt-4">
                                <Link
                                    to={`/rooms/${room.roomId}/leaderboard`}
                                    className="w-full group"
                                >
                                    <div className="relative flex items-center justify-center w-full overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-px">
                                        <div className="relative flex items-center justify-center w-full h-full px-4 py-2 sm:px-6 sm:py-3 bg-gray-800 rounded-lg group-hover:bg-transparent transition-all duration-300">
                                            <span className="text-white font-semibold group-hover:text-white transition-colors text-sm sm:text-base">
                                                Enter Room
                                            </span>
                                            <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 text-white transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoomComponent;