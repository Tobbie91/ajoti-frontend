import { Paper, Stack, Text } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import waveBottom from '@/assets/waveBottom.svg'
import waveSide from '@/assets/waveSide.svg'

interface SummaryCardProps {
    title: string
    amount: string
    gradient: string
    to?: string
}

export function SummaryCard({
    title,
    amount,
    gradient,
    to = '/transactions',
}: SummaryCardProps) {
    const navigate = useNavigate()

    return (
        <Paper
            radius={13.73}
            onClick={() => navigate(to)}
            style={{
                width: 378,
                minWidth: 378,
                height: 206,
                background: gradient,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'none', // Animate: Instant
                border: '1px solid rgba(0,0,0,0.06)',
            }}
        >
            {/* -------- content layer -------- */}
            <Stack
                gap={6}
                style={{
                    padding: 24,
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                <Text fz={18} fw={100} opacity={0.9}>
                    {title}
                </Text>

                <Text fz={30} fw={600} lh={1}>
                    {amount}
                </Text>
            </Stack>

            {/* -------- bottom wave -------- */}
            <img
                src={waveBottom}
                alt=""
                aria-hidden="true"
                style={{
    position: 'absolute',
    left: -6.86,
    top: 105,
    bottom: -20,
    width: 'auto',      // Let SVG natural width
    height: 'auto',     // Let SVG natural height
    objectFit: 'contain',
    zIndex: 1,
    pointerEvents: 'none',
    opacity: 1,
}}
            />

            {/* -------- side wave -------- */}
            <img
                src={waveSide}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: 12.58,
                    right: -45,          
                    height: 202.47,
                    width: 160.72,
                    objectFit: 'contain',
                    zIndex: 1,
                    pointerEvents: 'none',
                    opacity: 1,
                }}
            />

        </Paper>
    )
}
