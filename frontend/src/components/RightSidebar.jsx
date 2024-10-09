import React from 'react';
import { Plus } from 'lucide-react';

const RightSidebar = ({ isMobile, isRightSidebarOpen, activeTab }) => {
    const personDP = 'https://avatar.iran.liara.run/username?username=[firstname+lastname]';
    return (
        <div
            className={`w-full md:w-56 bg-gray-800 p-3 border-l border-gray-700 ${isMobile ? 'absolute right-0 top-0 h-full transition-transform duration-300 ease-in-out transform ' + (isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full') : ''}`}
        >
            <div className="bg-purple-600 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-3">
                #
            </div>
            <h2 className="text-lg mb-2">Code Sometimes</h2>
            <p className="text-xs mb-3">15 Members</p>
            <p className="text-xs mb-3">
                This channel is your space to collaborate, brainstorm, and discuss all things design-related with your fellow...
                <span className="text-blue-500 ml-1 cursor-pointer">More</span>
            </p>
            <h3 className="text-sm font-semibold mb-2">Group Members</h3>
            {['Person1', 'Person2'].map((name, index) => (
                <div key={index} className="flex items-center mb-2">
                    <img src={personDP} alt={name} className="w-5 h-5 rounded-full mr-2" />
                    <span className="text-xs">{name}</span>
                </div>
            ))}
            <button className="mt-3 flex items-center text-orange-500 text-sm">
                <Plus className="mr-2" size={16} />
                Invite
            </button>
        </div>
    );
};

export default RightSidebar;


// import React from 'react';
// import { Plus } from 'lucide-react';

// const RoomDetails = ({ roomDetails, loading, error }) => { // take the argument as it is doing in roomdetails
//     const userDp = 'https://avatar.iran.liara.run/username?username=[firstname+lastname]';

//     if (loading) return <div className="text-gray-300 p-4">Loading...</div>;
//     if (error) return <div className="text-red-500 p-4">{error}</div>;
//     if (!roomDetails) return <div className="text-gray-300 p-4">No room details available</div>;

//     return (
//         <div className="p-4">
//             <div className="bg-purple-600 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-3">
//                 #
//             </div>
//             <h2 className="text-lg mb-2">{roomDetails.name}</h2>
//             <p className="text-xs mb-3">{roomDetails.members.length} Members</p>
//             <p className="text-xs mb-3">
//                 {roomDetails.description}
//                 <span className="text-blue-500 ml-1 cursor-pointer">More</span>
//             </p>
//             <h3 className="text-md font-semibold mb-2">Group Members</h3>
//             {roomDetails.members.map((member) => (
//                 <div key={member._id} className="flex items-center mb-2">
//                     <img src={member.profilePicture || userDp} alt={member.username} className="w-5 h-5 rounded-full mr-2" />
//                     <span className="text-md">{member.username}</span>
//                 </div>
//             ))}
//             <button className="mt-3 flex items-center text-orange-500 text-sm">
//                 <Plus className="mr-2" size={16} />
//                 Invite
//             </button>
//         </div>
//     );
// };

// export default RoomDetails;