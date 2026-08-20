import { createApiClient } from '@ajoti/shared'
const {authRequest}=createApiClient({baseUrl:import.meta.env.VITE_API_BASE_URL??'',storagePrefix:'admin_',sessionExpiredRedirect:'/login',extraSessionKeys:['admin_kyc_completed','admin_verify_email']})
export const requestTransactionPinReset=()=>authRequest<{message:string}>('/api/users/me/pin/reset/request',{method:'POST'})
export const confirmTransactionPinReset=(otp:string,newPin:string)=>authRequest<{message:string}>('/api/users/me/pin/reset/confirm',{method:'POST',body:JSON.stringify({otp,newPin})})
