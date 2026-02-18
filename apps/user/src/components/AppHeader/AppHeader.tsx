// import { Menu } from '@mantine/core'
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom'
import { IconBell /* IconChevronDown */ } from '@tabler/icons-react'
import styles from './AppHeader.module.css'

type AppHeaderProps = {
  avatarSrc: string
  accountLabel?: string
}

type SvgProps = { className?: string }

function HomeIcon({ className }: SvgProps) {
  return (
    <svg
      className={className}
      width="22"
      height="25"
      viewBox="0 0 22 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.75 22H6.875V13.75H15.125V22H19.25V9.625L11 3.4375L2.75 9.625V22ZM0 24.75V8.25L11 0L22 8.25V24.75H12.375V16.5H9.625V24.75H0Z"
        fill="currentColor"
      />
    </svg>
  )
}

// SavingsIcon — commented out, coming soon
// function SavingsIcon({ className }: SvgProps) { ... }

function RoscaIcon({ className }: SvgProps) {
  return (
    <svg
      className={className}
      width="31"
      height="20"
      viewBox="0 0 31 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20.9681 19.5703C20.3158 19.5703 19.6812 19.5064 19.0642 19.3788C18.4473 19.2511 17.8472 19.0703 17.2638 18.8364C18.6383 17.5783 19.7161 16.1748 20.4971 14.626C21.278 13.0771 21.668 11.4635 21.6671 9.78513C21.6661 8.10675 21.2761 6.49313 20.4971 4.94429C19.718 3.39544 18.6402 1.99197 17.2638 0.733885C17.8462 0.500906 18.4464 0.32058 19.0642 0.192907C19.6821 0.0652342 20.3167 0.000931917 20.9681 0C23.694 0 26.0066 0.949624 27.9058 2.84887C29.805 4.74812 30.7542 7.06021 30.7533 9.78513C30.7523 12.5101 29.8032 14.8226 27.9058 16.7228C26.0084 18.623 23.6959 19.5721 20.9681 19.5703ZM15.3766 17.8229C14.0953 16.9376 13.0762 15.796 12.3195 14.3981C11.5628 13.0002 11.1839 11.4626 11.183 9.78513C11.1821 8.10768 11.5609 6.57002 12.3195 5.17214C13.0781 3.77427 14.0971 2.63267 15.3766 1.74735C16.658 2.63267 17.6775 3.77427 18.4352 5.17214C19.1928 6.57002 19.5712 8.10768 19.5703 9.78513C19.5693 11.4626 19.191 13.0002 18.4352 14.3981C17.6794 15.796 16.6599 16.9376 15.3766 17.8229ZM9.78513 19.5703C7.05928 19.5703 4.74719 18.6211 2.84887 16.7228C0.950557 14.8245 0.000932603 12.5119 6.85233e-07 9.78513C-0.000931232 7.05834 0.948693 4.74626 2.84887 2.84887C4.74905 0.951488 7.06114 0.00186383 9.78513 0C10.4375 0 11.0726 0.0643023 11.6904 0.192907C12.3083 0.321512 12.908 0.501838 13.4895 0.733885C12.1149 1.99197 11.0376 3.39591 10.2576 4.94569C9.4776 6.49546 9.08713 8.10861 9.0862 9.78513C9.0862 11.6257 9.46502 13.3325 10.2227 14.9056C10.9803 16.4786 12.0227 17.8122 13.3497 18.9063C12.7906 19.116 12.2142 19.279 11.6205 19.3955C11.0269 19.512 10.4151 19.5703 9.78513 19.5703Z"
        fill="currentColor"
      />
    </svg>
  )
}

function WalletIcon({ className }: SvgProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21 7H3C2.447 7 2 7.447 2 8V20C2 20.553 2.447 21 3 21H21C21.553 21 22 20.553 22 20V8C22 7.447 21.553 7 21 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 15C17.5523 15 18 14.5523 18 14C18 13.4477 17.5523 13 17 13C16.4477 13 16 13.4477 16 14C16 14.5523 16.4477 15 17 15Z"
        fill="currentColor"
      />
      <path
        d="M5 7V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H18C18.5304 3 19.0391 3.21071 19.4142 3.58579C19.7893 3.96086 20 4.46957 20 5V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// InvestmentsIcon — commented out, coming soon
// function InvestmentsIcon({ className }: SvgProps) { ... }

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function AppHeader({ avatarSrc, accountLabel = 'My account' }: AppHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logo}>AJOTI</div>

      {/* Nav */}
      <nav className={styles.nav}>
        <RouterNavLink
          to="/home"
          end
          className={({ isActive }) => cx(styles.navItem, isActive ? styles.active : styles.inactive)}
        >
          <HomeIcon className={styles.navIconHome} />
          <span className={styles.navLabel}>Home</span>
        </RouterNavLink>

        {/* Savings dropdown — coming soon */}

        <RouterNavLink
          to="/rosca"
          className={({ isActive }) => cx(styles.navItem, isActive ? styles.active : styles.inactive)}
        >
          <RoscaIcon className={styles.navIconRosca} />
          <span className={styles.navLabel}>ROSCA</span>
        </RouterNavLink>

        {/* Investments — coming soon */}

        <RouterNavLink
          to="/create-wallet"
          className={({ isActive }) => cx(styles.navItem, isActive ? styles.active : styles.inactive)}
        >
          <WalletIcon className={styles.navIconWallet} />
          <span className={styles.navLabel}>Wallet</span>
        </RouterNavLink>
      </nav>

      {/* Right side (bell + account) */}
      <div className={styles.right}>
        <div className={styles.bellWrap}>
          <IconBell className={styles.bellIcon} />
        </div>

        <div className={styles.account} onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className={styles.avatarRing}>
            <img className={styles.avatarImg} src={avatarSrc} alt="" />
          </div>
          <span className={styles.accountText}>{accountLabel}</span>
        </div>
      </div>
    </header>
  )
}
