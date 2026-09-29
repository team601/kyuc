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
          </div>
        )}
      </main>
    </div>
  );
}
