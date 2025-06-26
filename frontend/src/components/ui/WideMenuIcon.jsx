const WideMenuIcon = ({ className = '', isOpen = false, ...props }) => {
    return (
        <svg
            viewBox="0 0 28 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={28}
            height={20}
            {...props}
        >
            <rect
                x="2"
                y="3"
                width={isOpen ? 16 : 24}
                height="2.5"
                rx="1.25"
                fill="currentColor"
                className={`transition-all duration-300 ${isOpen ? 'origin-left' : ''}`}
            />
            <rect
                x="2"
                y="9"
                width={isOpen ? 20 : 24}
                height="2.5"
                rx="1.25"
                fill="currentColor"
                className={`transition-all duration-300 ${isOpen ? 'origin-left' : ''}`}
            />
            <rect
                x="2"
                y="15"
                width={isOpen ? 12 : 24}
                height="2.5"
                rx="1.25"
                fill="currentColor"
                className={`transition-all duration-300 ${isOpen ? 'origin-left' : ''}`}
            />
        </svg>
    );
};

export default WideMenuIcon;
