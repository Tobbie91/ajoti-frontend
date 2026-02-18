import { SparkleIcon } from './DashboardIcons'
import styles from './MyDashboard.module.css'

type MyDashboardProps = {
  userName?: string
  onFundWallet?: () => void
  onTransfer?: () => void
}

export function MyDashboard({
  userName = 'Osho',
  onFundWallet,
  onTransfer,
}: MyDashboardProps) {
  return (
    <section className={styles.wrap}>
      {/* Left: Greeting */}
      <div className={styles.greeting}>
        <div className={styles.greetingInner}>
          <div className={styles.hello}>Hello {userName}</div>
          <div className={styles.subRow}>
            <div className={styles.subText}>You&apos;re doing great</div>
            <SparkleIcon className={styles.sparkle} />
          </div>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className={styles.rightSide}>
        <div className={styles.actions}>
          <button type="button" className={styles.fundBtn} onClick={onFundWallet}>
            Fund Wallet
          </button>
          <button type="button" className={styles.transferBtn} onClick={onTransfer}>
            Transfer
          </button>
        </div>
      </div>
    </section>
  )
}
