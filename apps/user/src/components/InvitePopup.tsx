import boltIcon from "@/assets/boltIcon.svg"

type InvitePopupProps = {
    visible: boolean;
    onClose: () => void;
};

const InvitePopup = ({ visible, onClose }: InvitePopupProps) => {
    if (!visible) return null;
    return (
        <div className="w-full rounded-2xl bg-[#FCBC00] shadow-lg px-5 py-4 flex items-center gap-4 relative">
            <button
                type="button"
                aria-label="Close invite"
                onClick={onClose}
                className="absolute top-2 right-3 text-white text-lg leading-none"
            >
                ✕
            </button>

            <img src={boltIcon} alt="" className="w-10 h-10 flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-normal leading-relaxed">
                    Invite a friend and get N500 each. <br />
                    People you know might already be here!
                </span>
            </div>

            <button className="flex-shrink-0 bg-white rounded-lg px-4 py-2 text-xs font-medium text-[#FCBC00]">
                Invite now
            </button>
        </div>
    );
};

export default InvitePopup;
