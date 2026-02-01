export function CardWaves(): React.ReactElement {
    return (
        <>
            <svg
                viewBox="0 0 378 104"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -6,
                    width: '100%',
                    height: '70%',
                    opacity: 0.24,
                }}
            >
                <path
                    d="M0 74.5C59 39.5 103.5 116 178.5 74.5C253.5 33 282.5 60 378 24.5V104H0V74.5Z"
                    fill="currentColor"
                />
            </svg>

            <svg
                viewBox="0 0 378 104"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -10,
                    width: '100%',
                    height: '60%',
                    opacity: 0.1,
                }}
            >
                <path
                    d="M0 90C58 62 116 105 187 78C258 51 300 62 378 40V104H0V90Z"
                    fill="currentColor"
                />
            </svg>
        </>
    )
}