import { ActionIcon, Paper, Stack, Text } from '@mantine/core'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import waveBottom from '@/assets/waveBottom.svg'
import waveSide from '@/assets/waveSide.svg'

interface SummaryCardProps { title: string; amount: string; gradient: string; to?: string; hideable?: boolean; hidden?: boolean; onToggleHidden?: () => void }

export function SummaryCard({ title, amount, gradient, to = '/transactions', hideable = false, hidden = false, onToggleHidden }: SummaryCardProps) {
  const navigate = useNavigate()
  return <Paper radius={13.73} onClick={() => navigate(to)} style={{ width:'100%',height:206,background:gradient,color:'white',position:'relative',overflow:'hidden',cursor:'pointer',border:'1px solid rgba(0,0,0,0.06)' }}>
    <Stack gap={6} style={{padding:24,position:'relative',zIndex:2}}><Text fz={18} fw={100} opacity={0.9}>{title}</Text><div className="flex items-center gap-3"><Text fz={30} fw={600} lh={1}>{hidden ? '••••••' : amount}</Text>{hideable && onToggleHidden && <ActionIcon variant="subtle" aria-label={hidden?'Show wallet balance':'Hide wallet balance'} title={hidden?'Show wallet balance':'Hide wallet balance'} onClick={(e)=>{e.stopPropagation();onToggleHidden()}} style={{color:'rgba(255,255,255,.9)'}}>{hidden?<IconEye size={22}/>:<IconEyeOff size={22}/>}</ActionIcon>}</div></Stack>
    <img src={waveBottom} alt="" aria-hidden="true" style={{position:'absolute',left:-6.86,top:105,bottom:-20,width:'auto',height:'auto',objectFit:'contain',zIndex:1,pointerEvents:'none'}}/><img src={waveSide} alt="" aria-hidden="true" style={{position:'absolute',top:12.58,right:-45,height:202.47,width:160.72,objectFit:'contain',zIndex:1,pointerEvents:'none'}}/>
  </Paper>
}
