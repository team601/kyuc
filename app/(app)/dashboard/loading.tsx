import styles from './loading.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.page}>
      {/* Sidebar Skeleton */}
      <aside className={styles.sidebar}>
        <div className={`${styles.skeleton} ${styles.logoSkeleton}`} />
        <div className={styles.navSkeleton}>
          <div className={`${styles.skeleton} ${styles.navItemSkeleton}`} />
          <div className={`${styles.skeleton} ${styles.navItemSkeleton}`} />
          <div className={`${styles.skeleton} ${styles.navItemSkeleton}`} />
          <div className={`${styles.skeleton} ${styles.navItemSkeleton}`} />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className={styles.main}>
        <div className={styles.headerSkeleton}>
          <div>
            <div className={`${styles.skeleton} ${styles.greetingSkeleton}`} />
            <div className={`${styles.skeleton} ${styles.subSkeleton}`} />
          </div>
          <div className={`${styles.skeleton} ${styles.btnSkeleton}`} />
        </div>

        {/* Stats Skeleton */}
        <div className={styles.statsGrid}>
          <div className={`${styles.skeleton} ${styles.statCard}`} />
          <div className={`${styles.skeleton} ${styles.statCard}`} />
          <div className={`${styles.skeleton} ${styles.statCard}`} />
        </div>

        {/* Stories Grid Skeleton */}
        <div className={styles.storiesGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.storyCardSkeleton}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className={styles.skeleton} style={{ width: '80px', height: '22px', borderRadius: '9999px' }} />
                <div className={styles.skeleton} style={{ width: '90px', height: '18px' }} />
              </div>
              <div className={styles.skeleton} style={{ width: '70%', height: '28px' }} />
              <div className={styles.skeleton} style={{ width: '100%', height: '50px' }} />
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                <div className={styles.skeleton} style={{ width: '100px', height: '20px' }} />
                <div className={styles.skeleton} style={{ width: '80px', height: '20px' }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
