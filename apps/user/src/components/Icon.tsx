import {useState} from "react";

type IconButtonProps = {
    defaultIcon: string;
    pressedIcon: string;
    alt: string;
    onClick: () => void;
    width?: number;
    height?: number;
};

const IconButton = ({
    defaultIcon,
    pressedIcon,
    alt,
    onClick,
    width = 80,
    height = 80
    }: IconButtonProps) => {
    const[pressed, setPressed] = useState(false);

    return(
        <img
            src={pressed ? pressedIcon : defaultIcon}
            alt={alt}
            width={width}
            height={height}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            onClick={onClick}
            style={{ cursor: "pointer"}}
        />
    );
};

export default IconButton;