'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { backendTranslations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
import styles from './profile.module.css';

interface ProfileClientProps {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
  userEmail: string;
  userCreatedAt: string;
  categoryCounts: {
    roots: number;
    traditions: number;
    life_lessons: number;
  };
  totalStories: number;
  isGoogleUser: boolean;
}

export function ProfileClient({
  userId,
  initialDisplayName,
  initialAvatarUrl,
  userEmail,
  userCreatedAt,
  categoryCounts,
  totalStories,
  isGoogleUser,
}: ProfileClientProps) {
  const { lang, setLang } = useLanguage();
  const bt = backendTranslations[lang];

  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security'>('overview');

  // Profile fields
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data Export & Account Deletion fields
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const initial = displayName ? displayName[0].toUpperCase() : 'U';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileMsg(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setAvatarUrl(publicUrl);

      // Save to public.profiles
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setProfileMsg({ type: 'success', text: bt.profile.savedSuccess });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error uploading avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const supabase = createClient();

      // Update public.profiles
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          language_pref: lang,
        })
        .eq('id', userId);

      if (profileErr) throw profileErr;

      // Update auth metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          language_pref: lang,
        }
      });

      if (authErr) throw authErr;

      setProfileMsg({ type: 'success', text: bt.profile.savedSuccess });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error updating profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({
        type: 'error',
        text: lang === 'vi' ? 'Mật khẩu phải có ít nhất 6 ký tự' : 'Password must be at least 6 characters'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: bt.profile.passwordMismatch });
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMsg({ type: 'success', text: bt.profile.passwordUpdated });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Error updating password' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data: storiesData } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      const exportPayload = {
        export_date: new Date().toISOString(),
        profile: {
          id: userId,
          email: userEmail,
          displayName,
          createdAt: userCreatedAt,
        },
        stories: storiesData || [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kyuc-memories-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteError(lang === 'vi' ? 'Vui lòng nhập chính xác từ "DELETE" để xác nhận.' : 'Please type "DELETE" to confirm.');
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      const supabase = createClient();
      await supabase.from('stories').delete().eq('user_id', userId);
      await supabase.from('family_members').delete().eq('owner_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.signOut();
      window.location.href = '/login?deleted=true';
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting account');
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.back}>{bt.profile.backToStories}</Link>
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
        {/* Navigation Tabs */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {bt.profile.tabs.overview}
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {bt.profile.tabs.settings}
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'security' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            {bt.profile.tabs.security}
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className={styles.profileCard}>
              <div className={styles.avatar}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
                ) : (
                  initial
                )}
              </div>
              <h1 className={styles.name}>{displayName}</h1>
              <p className={styles.email}>{userEmail}</p>
              <p className={styles.joined}>
                {bt.profile.memberSince}{' '}
                {new Date(userCreatedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statNum}>{totalStories}</span>
                <span className={styles.statLabel}>{bt.profile.stats.totalStories}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNum}>{categoryCounts.roots}</span>
                <span className={styles.statLabel}>{bt.profile.stats.roots}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNum}>{categoryCounts.traditions}</span>
                <span className={styles.statLabel}>{bt.profile.stats.traditions}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNum}>{categoryCounts.life_lessons}</span>
                <span className={styles.statLabel}>{bt.profile.stats.lifeLessons}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/story/new" className="btn btn-primary">{bt.profile.actions.newStory}</Link>
              <Link href="/family" className="btn btn-ghost">{bt.profile.actions.familySpace}</Link>
            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNT SETTINGS */}
        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            <form onSubmit={handleSaveProfile} className={styles.settingsCard}>
              <div className={styles.avatarUploadArea}>
                <div className={styles.avatar}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
                  ) : (
                    initial
                  )}
                </div>
                <label className={styles.avatarInputLabel}>
                  {uploadingAvatar ? bt.profile.saving : `📷 ${bt.profile.uploadAvatar}`}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className={styles.avatarInputHidden}
                  />
                </label>
              </div>

              {profileMsg && (
                <div className={`${styles.alertBox} ${profileMsg.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                  {profileMsg.text}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{bt.profile.displayName}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{bt.profile.email}</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className={`${styles.formInput} ${styles.disabledInput}`}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{bt.profile.languagePref}</label>
                <select
                  value={lang}
                  onChange={e => setLang(e.target.value as 'vi' | 'en')}
                  className={styles.formInput}
                >
                  <option value="vi">Tiếng Việt (Vietnamese)</option>
                  <option value="en">English</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className={styles.saveBtn}
              >
                {savingProfile ? bt.profile.saving : bt.profile.saveChanges}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SECURITY / PASSWORD */}
        {activeTab === 'security' && (
          <div className={styles.tabContent}>
            <div className={styles.settingsCard}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                {bt.profile.changePassword}
              </h2>

              {isGoogleUser ? (
                <div className={styles.oauthBanner}>
                  <span style={{ fontSize: '1.5rem' }}>🔒</span>
                  <p>{bt.profile.oauthNotice}</p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {passwordMsg && (
                    <div className={`${styles.alertBox} ${passwordMsg.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{bt.profile.newPassword}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{bt.profile.confirmPassword}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={styles.formInput}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className={styles.saveBtn}
                  >
                    {savingPassword ? bt.profile.saving : bt.profile.changePassword}
                  </button>
                </form>
              )}
            </div>

            {/* Data Export Card */}
            <div className={styles.settingsCard} style={{ marginTop: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                {bt.profile.exportData}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                {bt.profile.exportDesc}
              </p>
              <button
                type="button"
                onClick={handleExportData}
                disabled={exporting}
                className={styles.secondaryBtn}
              >
                {exporting
                  ? (lang === 'vi' ? 'Đang chuẩn bị...' : 'Preparing export...')
                  : bt.profile.exportBtn}
              </button>
            </div>

            {/* Account Deletion Card */}
            <div className={`${styles.settingsCard} ${styles.dangerCard}`} style={{ marginTop: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#DC2626' }}>
                {bt.profile.deleteAccount}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-soft)', lineHeight: 1.5 }}>
                {bt.profile.deleteDesc}
              </p>

              {deleteError && (
                <div className={`${styles.alertBox} ${styles.alertError}`}>
                  {deleteError}
                </div>
              )}

              {showDeleteConfirm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991B1B' }}>
                    {bt.profile.deleteConfirmPrompt}
                  </p>
                  <input
                    type="text"
                    placeholder="DELETE"
                    value={deleteConfirmInput}
                    onChange={e => setDeleteConfirmInput(e.target.value)}
                    className={styles.formInput}
                    style={{ maxWidth: '200px' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className={styles.dangerBtn}
                    >
                      {deleting
                        ? (lang === 'vi' ? 'Đang xóa...' : 'Deleting...')
                        : (lang === 'vi' ? 'Xác nhận xóa tài khoản' : 'Confirm Deletion')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmInput('');
                        setDeleteError('');
                      }}
                      className={styles.secondaryBtn}
                    >
                      {lang === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className={styles.dangerBtn}
                >
                  {bt.profile.deleteBtn}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
