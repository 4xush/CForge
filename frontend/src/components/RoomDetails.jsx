import React from 'react';
import { Plus, Users, Calendar, Lock, Unlock, User } from 'lucide-react';

const RoomDetails = ({ roomDetails, loading, error }) => {
    const userDp = 'https://avatar.iran.liara.run/username?username=[firstname+lastname]';

    if (loading) return <div className="text-gray-300 p-4">Loading...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;
    if (!roomDetails) return <div className="text-gray-300 p-4">No room details available</div>;

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="p-4 h-full overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 mb-4">
                <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 mx-auto">
                    #
                </div>
                <h2 className="text-xl font-bold text-center mb-1">{roomDetails.name}</h2>
                <p className="text-sm font-bold text-center">@{roomDetails.roomId}</p>
                <p className="text-sm text-center mb-2">{roomDetails.description}</p>
                <div className="flex justify-center items-center">
                    {roomDetails.isPublic ? (
                        <span className="flex items-center text-xs bg-green-500 text-white px-2 py-1 rounded">
                            <Unlock size={12} className="mr-1" /> Public
                        </span>
                    ) : (
                        <span className="flex items-center text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                            <Lock size={12} className="mr-1" /> Private
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="text-md font-semibold mb-2 flex items-center">
                    <Calendar size={16} className="mr-2" /> Created
                </h3>
                <p className="text-sm">{formatDate(roomDetails.createdAt)}</p>
                <p className="text-sm mt-1">by {roomDetails.createdBy}</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="text-md font-semibold mb-2 flex items-center">
                    <Users size={16} className="mr-2" /> Members ({roomDetails.members.length})
                </h3>
                <div className="space-y-2">
                    {roomDetails.members.map((member) => (
                        <div key={member._id} className="flex items-center">
                            <img src={member.profilePicture || userDp} alt={member.username} className="w-8 h-8 rounded-full mr-2" />
                            <span className="text-sm">{member.username}</span>
                            {roomDetails.admins.some(admin => admin._id === member._id) && (
                                <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">Admin</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="text-md font-semibold mb-2 flex items-center">
                    <User size={16} className="mr-2" /> Admins ({roomDetails.admins.length})
                </h3>
                <div className="space-y-2">
                    {roomDetails.admins.map((admin) => (
                        <div key={admin._id} className="flex items-center">
                            <img src={admin.profilePicture || userDp} alt={admin.username} className="w-8 h-8 rounded-full mr-2" />
                            <span className="text-sm">{admin.username}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-300">
                <Plus size={16} className="mr-2" />
                Invite Members
            </button>
        </div>
    );
};

export default RoomDetails;