// src/components/profile/ProfileHeader.jsx
import React from 'react';
import { Camera, Mail, GitBranch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SocialLinks from './SocialLinks.jsx';

export const ProfileHeader = ({ user }) => (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 p-1">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Camera className="h-12 w-12 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <h2 className="text-2xl font-bold text-gray-900">{user?.fullName || 'Unknown User'}</h2>
                            <SocialLinks socialNetworks={user?.socialNetworks} />
                        </div>
                        <p className="text-gray-500">@{user?.username || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                        <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">{user?.email || 'Email not available'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <GitBranch className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown Date'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);