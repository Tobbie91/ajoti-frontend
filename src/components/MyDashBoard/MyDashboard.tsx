import { Menu } from '@mantine/core'
import { IconChevronDown, IconWorld, IconLock } from '@tabler/icons-react'
import { SparkleIcon } from './SparkleIcon'
import styles from './MyDashboard.module.css'

type MyDashboardProps = {
  userName?: string
  tierLabel?: string
  languageLabel?: string
  onFundWallet?: () => void
  onTransfer?: () => void
  onChangeLanguage?: (lang: string) => void
}

export function MyDashboard({
  userName = 'Osho',
  tierLabel = 'Tier 2',
  languageLabel = 'EN',
  onFundWallet,
  onTransfer,
  onChangeLanguage,
}: MyDashboardProps) {
  return (
    <section className={styles.wrap}>
      {/* Language selector (top-right) */}
      <div className={styles.lang}>
        <Menu withinPortal position="bottom-end" offset={8}>
          <Menu.Target>
            <button type="button" className={styles.langBtn}>
              <IconWorld className={styles.langIcon} />
              <span className={styles.langText}>{languageLabel}</span>
              <IconChevronDown className={styles.langChevron} />
            </button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item onClick={() => onChangeLanguage?.('EN')}>EN</Menu.Item>
            <Menu.Item onClick={() => onChangeLanguage?.('FR')}>FR</Menu.Item>
            <Menu.Item onClick={() => onChangeLanguage?.('ES')}>ES</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>

      {/* Greeting + Tier */}
      <div className={styles.greeting}>
        <div className={styles.greetingInner}>
          <div className={styles.hello}>Hello {userName}</div>

          <div className={styles.subRow}>
            <div className={styles.subText}>You&apos;re doing great</div>
            <SparkleIcon className={styles.sparkle} />
          </div>
        </div>

        <div className={styles.tier}>
          <div className={styles.tierInner}>
            <IconLock className={styles.tierIcon} />
            <span className={styles.tierText}>{tierLabel}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button type="button" className={styles.fundBtn} onClick={onFundWallet}>
          Fund Wallet
        </button>

        <button type="button" className={styles.transferBtn} onClick={onTransfer}>
          Transfer
        </button>
      </div>
    </section>
  )
}
