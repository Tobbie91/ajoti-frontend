// import React from "react";
import boltIcon from "@/assets/boltIcon.svg"

type InvitePopupProps = {
    visible: boolean;
    onClose: () => void;
};

const InvitePopup = ({ visible, onClose }: InvitePopupProps) => {
    if (!visible) return null;
    return(
        <div className = "absolute top-[699px] left-[120px] w-[571px] h-[104px] rounded-[16px] bg-[#FCBC00]  shadow-lg p-4 w-64">
            <button
                type="button"
                aria-label="Close invite"
                onClick={onClose}
                className="absolute top-[10px] right-[12px] text-white text-[18px] leading-none"
            >
                ×
            </button>
            <div className="flex items-center gap-2 mb-2">
                <img src={boltIcon} alt="Bolt Icon" className=" absolute top-[12px] left-[21px]" />
                <span className=" absolute top-[16px] left-[64px] font-[400] text-[18px] leading-[26px] text-[#FFFFFF] font-inter">
                Invite a friend and get N500 each. <br />
                People you know might already be here!
                </span>
            </div>
            <button className="absolute top-[25px] left-[451px] bg-white rounded-[7.06px]  w-[97.65px] h-[40px]">
                 <span className="font-[400] text-[11.76px] leading-[26px] text-[#FCBC00] font-inter w-[59px] h-[22px]">
                    Invite now
                 </span>
            </button>
        </div>
    ); 
};

export default InvitePopup;
