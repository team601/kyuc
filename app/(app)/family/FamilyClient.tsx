'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
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
  inviterName?: string | null;
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

  // Edit member state
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const openEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setEditName(member.displayName || '');
    setEditRole(member.role || '');
    setEditAvatarUrl(member.avatarUrl || null);
    setEditAvatarPreview(member.avatarUrl || null);
    setEditAvatarFile(null);
    setEditError(null);
    setEditSuccess(false);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditAvatarFile(file);
      setEditAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      let finalAvatarUrl = editAvatarUrl;

      if (editAvatarFile) {
        const supabase = createClient();
        const ext = editAvatarFile.name.split('.').pop() || 'webp';
        const filePath = `avatars/${editingMember.id}-${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('photos')
          .upload(filePath, editAvatarFile, { contentType: editAvatarFile.type });

        if (uploadErr) {
          throw new Error(uploadErr.message);
        }
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(uploadData.path);
          finalAvatarUrl = urlData.publicUrl;
        }
      }

      const res = await fetch('/api/family/member', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: editingMember.id,
          role: editRole,
          customName: editName,
          customAvatarUrl: finalAvatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member');
      }

      setMembers(prev =>
        prev.map(m =>
          m.id === editingMember.id
            ? {
                ...m,
                displayName: editName.trim() || m.displayName,
                role: editRole.trim() || null,
                avatarUrl: finalAvatarUrl,
              }
            : m
        )
      );

      setEditSuccess(true);
      router.refresh();
      setTimeout(() => {
        setEditingMember(null);
        setEditSuccess(false);
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || 'Error updating member');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const isOwnerCircle = memberId.startsWith('owner-');
    const realId = isOwnerCircle ? memberId.replace('owner-', '') : memberId;
    const confirmMessage = isOwnerCircle
      ? bt.family.leaveFamilyConfirm
      : bt.family.deleteMemberConfirm;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/family/member?id=${realId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId && m.id !== realId));
        if (editingMember?.id === memberId || editingMember?.id === realId) {
          setEditingMember(null);
        }
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Could not remove member');
      }
    } catch {
      alert('Error removing member');
    }
  };

  // Auto-accept if user opened invite link with ?invite=...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('invite');
    if (inviteId && pendingInvites.some(inv => inv.id === inviteId)) {
      handleRespondInvite(inviteId, true);
      window.history.replaceState({}, '', '/family');
    }
  }, [pendingInvites]);

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
              <p>{bt.family.invitationDesc(invite.inviterName || invite.member_email)}</p>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {!member.isOwner && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditMember(member)}
                              title={bt.family.editMember}
                              style={{
                                background: '#F5F5F4',
                                border: '1px solid #E7E5E4',
                                color: 'var(--color-ink)',
                                fontSize: '0.725rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                padding: '0.2rem 0.5rem',
                                borderRadius: 'var(--radius-md)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                              }}
                            >
                              ✏️ {bt.family.editMember}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.id)}
                              title={bt.family.deleteMember}
                              style={{
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                fontSize: '0.725rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                padding: '0.2rem 0.45rem',
                                borderRadius: 'var(--radius-md)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                              }}
                            >
                              🗑️ {bt.family.deleteMember}
                            </button>
                          </>
                        )}
                        {member.isOwner && member.member_id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id)}
                            title={bt.family.leaveFamily}
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              color: '#DC2626',
                              fontSize: '0.725rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--radius-md)',
                            }}
                          >
                            🚪 {bt.family.leaveFamily}
                          </button>
                        )}
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

      {/* Edit Member Modal */}
      {editingMember && (
        <div className={styles.modalBackdrop} onClick={() => setEditingMember(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{bt.family.editMemberTitle}</h3>
            <p className={styles.modalDesc}>{bt.family.editMemberDesc}</p>

            {editSuccess && (
              <div style={{ background: '#F0FDF4', color: '#166534', padding: '0.65rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {bt.family.memberUpdated}
              </div>
            )}

            {editError && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '0.65rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              {/* Avatar Selector */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#E8503A',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    border: '3px solid #FAF7F2',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {editAvatarPreview ? (
                    <img
                      src={editAvatarPreview}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    (editName || editingMember.displayName || editingMember.member_email || 'M')[0]?.toUpperCase()
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.8rem' }}
                  >
                    📷 {bt.family.changeAvatar}
                  </button>
                  {editAvatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditAvatarFile(null);
                        setEditAvatarUrl(null);
                        setEditAvatarPreview(null);
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.8rem', color: '#DC2626' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{bt.family.nicknameLabel}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder={bt.family.nicknamePlaceholder}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{bt.family.roleLabel}</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  placeholder={bt.family.rolePlaceholder}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteMember(editingMember.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.4rem 0.2rem',
                  }}
                >
                  🗑️ {bt.family.deleteMember}
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditingMember(null)}
                  >
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="btn btn-primary"
                  >
                    {savingEdit ? bt.story.saving : bt.family.saveMember}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
