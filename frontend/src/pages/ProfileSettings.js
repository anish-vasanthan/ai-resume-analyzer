import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadAvatar, deleteAvatar } from '../services/api';
import {
  User, Mail, Camera, Trash2, Save, ArrowLeft,
  CheckCircle, AlertCircle, Sparkles, Shield, Key
} from 'lucide-react';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name,       setName]       = useState(user?.name  || '');
  const [email,      setEmail]      = useState(user?.email || '');
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const [preview,    setPreview]    = useState(user?.avatar || null);

  const fileRef = useRef(null);

  const showSuccess = (msg) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); };
  const showError   = (msg) => { setError(msg);   setSuccess(''); };

  /* ── save name/email ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showError('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await updateProfile({ name: name.trim(), email: email.trim() });
      updateUser({ name: res.data.name, email: res.data.email });
      showSuccess('Profile updated successfully!');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('Network')) {
        showError('Connection is slow — changes may have saved. Please refresh to confirm.');
      } else {
        showError(msg || 'Failed to update profile');
      }
    } finally { setSaving(false); }
  };

  /* ── avatar upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showError('Image must be under 2MB'); return; }

    // local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const res = await uploadAvatar(file);
      updateUser({ avatar: res.data.avatar });
      showSuccess('Profile picture updated!');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('Network')) {
        showError('Connection is slow — please try again in a moment.');
      } else {
        showError(msg || 'Failed to upload image');
      }
      setPreview(user?.avatar || null);
    } finally { setUploading(false); }
  };

  /* ── remove avatar ── */
  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      await deleteAvatar();
      updateUser({ avatar: null });
      setPreview(null);
      showSuccess('Profile picture removed');
    } catch (err) {
      showError(err.message || 'Failed to remove image');
    } finally { setUploading(false); }
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* header */}
        <div className="flex items-center space-x-4 mb-8 animate-slide-up">
          <button onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Profile Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account information</p>
          </div>
        </div>

        {/* feedback */}
        {success && (
          <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-center space-x-3 text-green-700 dark:text-green-400 animate-fade-in">
            <CheckCircle className="h-5 w-5 flex-shrink-0" /><span className="text-sm font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-3 text-red-700 dark:text-red-400 animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /><span className="text-sm">{error}</span>
          </div>
        )}

        {/* ── avatar card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-8 mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h2 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <Camera className="h-5 w-5 text-green-500" /><span>Profile Picture</span>
          </h2>
          <div className="flex items-center space-x-6">
            {/* avatar display */}
            <div className="relative flex-shrink-0">
              {preview ? (
                <img src={preview} alt="avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                  <span className="text-white text-2xl font-black">{initials}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* actions */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Upload a photo to personalise your account. JPG, PNG, WEBP or GIF — max 2MB.
              </p>
              <div className="flex items-center space-x-3">
                <input ref={fileRef} type="file" className="hidden"
                  accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleAvatarChange} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-sm hover:scale-105 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50">
                  <Camera className="h-4 w-4" />
                  <span>{uploading ? 'Uploading…' : 'Upload Photo'}</span>
                </button>
                {preview && (
                  <button onClick={handleRemoveAvatar} disabled={uploading}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all disabled:opacity-50">
                    <Trash2 className="h-4 w-4" /><span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── profile info card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-8 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <User className="h-5 w-5 text-green-500" /><span>Account Information</span>
          </h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white transition-all outline-none"
                  placeholder="Your full name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white transition-all outline-none"
                  placeholder="you@example.com" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02]">
              {saving
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save className="h-5 w-5" /><span>Save Changes</span></>}
            </button>
          </form>
        </div>

        {/* ── account info card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" /><span>Account Details</span>
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Account Type', value: user?.googleId ? 'Google Account' : 'Email & Password', icon: user?.googleId ? '🔵' : '📧' },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—', icon: '📅' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
