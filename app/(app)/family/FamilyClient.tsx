'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import styles from './family.module.css';

interface FamilyMember {
  id: string;
  member_email: string;
  role?: string | null;
  status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  member_id?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  isOwner?: boolean;
}

interface PendingInvite {
  id: string;
  owner_id: string;
  member_email: string;
  invited_at: string;
}

interface Story {
  id: string;
  title: string;
  category: string;
  created_at: string;
  content_text?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
}

interface FamilyClientProps {
  currentUser: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  initialMembers: FamilyMember[];
  initialPendingInvites: PendingInvite[];
  familyStories: Story[];
}

export function FamilyClient({
  currentUser,
  initialMembers,
  initialPendingInvites,
  familyStories,
}: FamilyClientProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const bt = backendTranslations[lang];

  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(initialPendingInvites);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const res = await fetch('/api/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole.trim() || undefined,
          lang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (lang === 'vi' ? 'Lỗi khi gửi lời mời' : 'Error sending invite'));
      }

      if (data.member) {
        setMembers(prev => [data.member, ...prev.filter(m => m.member_email !== data.member.member_email)]);
      }

      setInviteSuccess(true);
      setInviteEmail('');
      setInviteRole('');
      router.refresh();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
      }, 1200);
    } catch (err: any) {
      setInviteError(err.message || (lang === 'vi' ? 'Không thể gửi lời mời. Vui lòng thử lại.' : 'Could not send invite.'));
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvite = async (memberId: string) => {
    const confirmCancel = window.confirm(
      lang === 'vi' ? 'Bạn có chắc chắn muốn hủy lời mời này?' : 'Are you sure you want to cancel this invitation?'
    );
    if (!confirmCancel) return;

    try {
      const res = await fetch(`/api/family/invite?id=${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  const handleRespondInvite = async (inviteId: string, accept: boolean) => {
    try {
      const res = await fetch('/api/family/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, accept }),
      });

      if (res.ok) {
        setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
        if (accept) {
          alert(bt.family.acceptedSuccess);
        }
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.back}>
          {bt.family.backToDashboard}
        </Link>
        <Link href="/" className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M6 4v20M6 14L20 6M6 14L20 22" stroke="#E8503A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>kyuc<sup>°</sup></span>
        </Link>
        <div className={styles.headerRight}>
          <LanguageSwitcher />
          <form action="/auth/signout" method="POST">
            <button type="submit" style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-md)',
            }}>
              {bt.nav.signOut}
            </button>
          </form>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>👨‍👩‍👧‍👦</div>
          <h1 className={styles.heroTitle}>{bt.family.title}</h1>
          <p className={styles.heroSub}>{bt.family.subtitle}</p>
        </div>

        {/* Incoming invitations for me */}
        {pendingInvites.map(invite => (
          <div key={invite.id} className={styles.inviteBanner}>
            <div className={styles.inviteBannerText}>
              <h4>{bt.family.invitationForYou}</h4>
              <p>{bt.family.invitationDesc(invite.member_email)}</p>
            </div>
            <div className={styles.inviteBannerActions}>
              <button
                className={styles.acceptBtn}
                onClick={() => handleRespondInvite(invite.id, true)}
              >
                {bt.family.accept}
              </button>
              <button
                className={styles.declineBtn}
                onClick={() => handleRespondInvite(invite.id, false)}
              >
                {bt.family.decline}
              </button>
            </div>
          </div>
        ))}

        {/* Family Members Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{bt.family.members}</h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-primary btn-sm"
            >
              {bt.family.inviteBtn}
            </button>
          </div>

          <div className={styles.membersGrid}>
            {/* Current user card */}
            <div className={styles.memberCard}>
              <div className={styles.memberAvatar}>
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  currentUser.displayName[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className={styles.memberInfo}>
                <p className={styles.memberName}>{currentUser.displayName} {bt.family.you}</p>
                <p className={styles.memberRole}>{bt.family.host}</p>
                <span className={`${styles.memberStatus} ${styles.statusAccepted}`}>
                  ✓ {bt.family.acceptedStatus}
                </span>
              </div>
            </div>

            {/* Invited and Joined members */}
            {members.map(member => {
              const displayName = member.displayName || member.member_email;
              const initial = displayName[0]?.toUpperCase() || 'M';
              return (
                <div key={member.id} className={styles.memberCard}>
                  <div
                    className={styles.memberAvatar}
                    style={{ background: member.isOwner ? '#E8503A' : '#736F6E' }}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={displayName}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className={styles.memberInfo}>
                    <p className={styles.memberName}>
                      {displayName}
                      {member.isOwner && (
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            marginLeft: '0.35rem',
                            color: '#E8503A',
                            background: '#FFF2EE',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            display: 'inline-block',
                          }}
                        >
                          {lang === 'vi' ? 'Chủ phòng' : 'Host'}
                        </span>
                      )}
                    </p>
                    <p className={styles.memberRole}>{member.role || (lang === 'vi' ? 'Người thân' : 'Family')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className={`${styles.memberStatus} ${member.status === 'accepted' ? styles.statusAccepted : styles.statusPending}`}>
                        {member.status === 'accepted' ? `✓ ${bt.family.acceptedStatus}` : `⏳ ${bt.family.pendingStatus}`}
                      </span>
                      {member.status === 'pending' && !member.isOwner && (
                        <button
                          type="button"
                          onClick={() => handleCancelInvite(member.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            padding: '0.1rem 0.3rem',
                          }}
                        >
                          {lang === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Family Memory Wall / Stories Feed */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{bt.family.familyFeed}</h2>
            <Link href="/story/new" className="btn btn-ghost btn-sm">
              + {bt.profile.actions.newStory}
            </Link>
          </div>

          {familyStories.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📖</div>
              <p className={styles.emptyText}>{bt.family.noFamilyStories}</p>
              <Link href="/story/new" className="btn btn-primary">
                {bt.dashboard.empty.cta}
              </Link>
            </div>
          ) : (
            <div className={styles.storiesGrid}>
              {familyStories.map(story => (
                <Link
                  href={`/story/${story.id}`}
                  key={story.id}
                  style={{
                    background: 'white',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.25rem',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {story.image_url && (
                    <img
                      src={story.image_url}
                      alt={story.title}
                      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                    />
                  )}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                    {story.title}
                  </h3>
                  {story.content_text && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                      {story.content_text.slice(0, 90)}…
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #F4EFEA', fontSize: '0.75rem', color: 'var(--color-subtle)' }}>
                    <span>{new Date(story.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                    {story.audio_url && <span style={{ color: '#E8503A', fontWeight: 600 }}>🎙 Đã ghi âm</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{bt.family.inviteModalTitle}</h3>
            <p className={styles.modalDesc}>{bt.family.inviteDesc}</p>

            {inviteSuccess && (
              <div style={{ background: '#F0FDF4', color: '#166534', padding: '0.65rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {bt.family.inviteSent}
              </div>
            )}

            {inviteError && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '0.65rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {inviteError}
              </div>
            )}

            <form onSubmit={handleSendInvite} className={styles.modalForm}>
              <div className="form-group">
                <label className="form-label">{bt.family.emailLabel}</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="family.member@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{bt.family.roleLabel}</label>
                <input
                  type="text"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  placeholder={bt.family.rolePlaceholder}
                  className="form-input"
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowInviteModal(false)}
                >
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="btn btn-primary"
                >
                  {sendingInvite ? bt.family.sending : bt.family.sendInvite}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
