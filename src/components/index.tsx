// Export your components here
// Example: export { Button } from './Button'
import React, {useState} from "react";

interface IconButtonProps {
    defalutIcon: string;
    pressedIcon: string;
    label: string;
    onClick?: () => void;
}

export const IconButton: React.FC<IconButtonProps> = ({defalutIcon, pressedIcon, label, onClick}) => {
    const[isPressed, setIsPressed] = useState(false);

    const handleClick = () => {
        setIsPressed(!isPressed);
        if(onClick) onClick();
    };
    
    return(
        <button
            onClick={handleClick} 
            className = "flex flex-col items-center gap-2 p-4 border rounded-lg"
            >
            <img
                src={isPressed ? pressedIcon : defalutIcon}
                alt={label}
                className="w-16 h-16"
            />
            <span className="text-sm">{label}</span>
        </button>
    );
};

export default IconButton;