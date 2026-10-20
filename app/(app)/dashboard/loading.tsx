import styles from './loading.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.topBar} />
      <main className={styles.main}>
        <div className={styles.col}>
          <div className={styles.skeleton} style={{ width: '40%', height: 16 }} />
          <div className={styles.skeleton} style={{ width: '70%', height: 40 }} />
          <div className={styles.skeleton} style={{ width: '100%', height: 150, borderRadius: 24 }} />
          <div className={styles.skeleton} style={{ width: '100%', height: 54, borderRadius: 999 }} />
        </div>
        <div className={styles.col}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.skeleton} style={{ width: '100%', height: 90, borderRadius: 20 }} />
          ))}
        </div>
      </main>
    </div>
  );
}
