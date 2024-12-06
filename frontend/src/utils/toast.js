import toast from 'react-hot-toast';

export const showToast = ({ title, description, variant }) => {
    if (variant === 'success') {
        toast.success(`${title}: ${description}`);
    } else if (variant === 'destructive') {
        toast.error(`${title}: ${description}`);
    } else {
        toast(`${title}: ${description}`);
    }
};
