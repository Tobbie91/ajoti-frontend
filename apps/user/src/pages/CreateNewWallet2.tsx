import { useNavigate } from "react-router-dom"

import vector from '@/assets/Vector.svg'
export function CreateNewWallet2(){
    const navigate = useNavigate();

    return(
    <div >
        <button onClick={() => navigate(-1)}
        style={{
            position: "absolute",
            top:"179px",
            left:"367px",
            width:"84px",
            height:"30px",
            gap:"13px",
            display: "flex",
            flexDirection: "row",
            border: "2px solid black",
        }} >
            <img
            src={vector}
            style={{width:"16px",height:"16px", border: "2px solid black",}}
            />
            <span style={{display:"inline-block" ,width:"55px",height:"80px", lineHeight:"30px"}}>
                back
            </span>
        </button>
    </div>
  )
}