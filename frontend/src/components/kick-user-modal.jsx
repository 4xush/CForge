import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog.jsx";
import { Button } from "./ui/Button.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";

const KickUserModal = ({ isOpen, onClose, onConfirm, members, setSelectedUser }) => {
    const [selectedMemberId, setSelectedMemberId] = useState('');

    const handleConfirm = () => {
        const selectedMember = members.find(member => member._id === selectedMemberId);
        if (selectedMember) {
            setSelectedUser(selectedMember);
            onConfirm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kick User</DialogTitle>
                    <DialogDescription>
                        Select a user to kick from the room. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <Select
                    value={selectedMemberId}
                    onValueChange={setSelectedMemberId}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a user to kick" />
                    </SelectTrigger>
                    <SelectContent>
                        {members.map((member) => (
                            <SelectItem key={member._id} value={member._id}>
                                {member.username}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!selectedMemberId}
                    >
                        Kick User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default KickUserModal;
