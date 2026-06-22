import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  Save, 
  ShieldAlert 
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Profile forms states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password forms states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Update profile details handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      showToast('Name and Email are required.', 'warning');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile(profileName, profileEmail);
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update profile details.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast('All password fields are required.', 'warning');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, confirmNewPassword);
      showToast('Password changed successfully.', 'success');
      // Reset password forms
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to change password. Make sure current password is correct.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Configuration</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure your partner details and security credentials.</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Hand Card: Profile Details */}
        <div className="glass-panel profile-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} style={{ color: 'var(--primary)' }} />
            <span>Rider Information</span>
          </h2>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label htmlFor="profile-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={18} />
                </span>
                <input
                  id="profile-name"
                  type="text"
                  className="form-control"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{ paddingLeft: '2.75rem', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profile-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={18} />
                </span>
                <input
                  id="profile-email"
                  type="email"
                  className="form-control"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  style={{ paddingLeft: '2.75rem', width: '100%' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '1rem', width: '100%' }}
              disabled={isUpdatingProfile}
            >
              <Save size={18} />
              <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>

          {/* Account Actions Section */}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2.5rem', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '1rem' }}>Danger Zone</h3>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
            >
              <LogOut size={18} />
              <span>Logout Account</span>
            </button>
          </div>
        </div>

        {/* Right Hand Card: Change Password */}
        <div className="glass-panel profile-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} style={{ color: 'var(--warning)' }} />
            <span>Update Password</span>
          </h2>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="curr-password">Current Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={18} />
                </span>
                <input
                  id="curr-password"
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ paddingLeft: '2.75rem', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={18} />
                </span>
                <input
                  id="new-password"
                  type="password"
                  className="form-control"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '2.75rem', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={18} />
                </span>
                <input
                  id="confirm-new-password"
                  type="password"
                  className="form-control"
                  placeholder="Repeat new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  style={{ paddingLeft: '2.75rem', width: '100%' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '1rem', width: '100%' }}
              disabled={isChangingPassword}
            >
              <ShieldAlert size={18} />
              <span>{isChangingPassword ? 'Modifying...' : 'Change Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
