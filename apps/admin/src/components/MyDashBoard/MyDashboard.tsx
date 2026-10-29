import { HeroLandscape } from './HeroLandscape';
import styles from "./MyDashboard.module.css";

type MyDashboardProps = {
  userName?: string;
  onFundWallet?: () => void;
  onTransfer?: () => void;
  onCreateCircle?: () => void;
};

export function MyDashboard({
  userName = "Osho",
  onFundWallet,
  onTransfer,
  onCreateCircle,
}: MyDashboardProps) {
  return (
    <section className={styles.wrap}>
      {/* Left: Greeting */}
      <div className={styles.greeting}>
        <div className={styles.greetingInner}>
          <div className={styles.hello}>Hello, {userName}.</div>
          <h1 className={styles.headline}>Everything grows<br />together.</h1>
          <div className={styles.subRow}>
            <div className={styles.subText}>Your circles, savings and goals — moving you closer to a brighter tomorrow.</div>
          </div>
          {onCreateCircle && <button type="button" className={styles.createBtn} onClick={onCreateCircle}>＋ Create a circle</button>}
        </div>
      </div>

      {/* Right: Action buttons */}
      {(onFundWallet || onTransfer) && <div className={styles.rightSide}>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.fundBtn}
            onClick={onFundWallet}
          >
            Fund Wallet
          </button>
          <button
            type="button"
            className={styles.transferBtn}
            onClick={onTransfer}
          >
            Withdraw
          </button>
        </div>
      </div>}
      <div className={styles.landscape} aria-hidden="true"><HeroLandscape /></div>
    </section>
  );
}
