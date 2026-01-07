import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Key } from 'lucide-react';
import { Button } from '../components/ui';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-secondary-100/30 blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl relative z-10 animate-fade-in-up border border-gray-100">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <Key className="text-white h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Set New Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-success-50 border border-success-100 rounded-xl p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mb-3 text-success-600">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Password Reset Successful!</h3>
              <p className="text-sm text-gray-600 mt-2">
                Your password has been updated. You can now login with your new credentials.
              </p>
              <p className="text-xs text-primary-600 mt-4 font-medium animate-pulse">
                Redirecting to login...
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex items-start gap-3 animate-shake">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              {/* New Password */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex="-1"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || !token}
              className="w-full justify-center py-3 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Reset Password
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                Cancel, take me back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
