import { NavLink } from 'react-router-dom'
import { Menu } from '@mantine/core'
import {
  IconBell,
  IconChevronDown,
  IconHome2,
  IconPigMoney,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react'
import styles from './AppHeader.module.css'

type AppHeaderProps = {
  avatarSrc?: string
  accountLabel?: string
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navItem} ${styles.active}` : styles.navItem

export function AppHeader({ avatarSrc, accountLabel = 'My account' }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logo}>AJOTI</div>

        {/* Center navigation */}
        <nav className={styles.nav} aria-label="Primary">
          <NavLink to="/" className={navClass}>
            <IconHome2 className={styles.iconActive} />
            <span>Home</span>
          </NavLink>

          {/* Savings dropdown */}
          <Menu withinPortal position="bottom-start" offset={10}>
            <Menu.Target>
              <button type="button" className={styles.navButton}>
                <IconPigMoney className={styles.iconMuted} />
                <span className={styles.mutedText}>Savings</span>
                <IconChevronDown className={styles.chevron} />
              </button>
            </Menu.Target>

            <Menu.Dropdown className={styles.dropdown}>
              <Menu.Item component={NavLink} to="/savings/fixed">
                Fixed Savings
              </Menu.Item>
              <Menu.Item component={NavLink} to="/savings/target">
                Target Savings
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <NavLink to="/rosca" className={navClass}>
            <IconUsers className={styles.iconMuted} />
            <span className={styles.mutedText}>ROSCA</span>
          </NavLink>

          <NavLink to="/investments" className={navClass}>
            <IconTrendingUp className={styles.iconMuted} />
            <span className={styles.mutedText}>Investments</span>
          </NavLink>
        </nav>

        {/* Right side */}
        <div className={styles.right}>
          <button className={styles.bell} type="button" aria-label="Notifications">
            <IconBell className={styles.bellIcon} />
          </button>

          <div className={styles.account}>
            <div className={styles.avatar}>
              {avatarSrc ? (
                <img className={styles.avatarImg} src={avatarSrc} alt="Account avatar" />
              ) : (
                <div className={styles.avatarFallback} aria-hidden="true">
                  A
                </div>
              )}
            </div>
            <span className={styles.accountLabel}>{accountLabel}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
