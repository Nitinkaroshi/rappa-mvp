import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function VerifyEmailChange() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token.');
      setLoading(false);
      return;
    }

    verifyEmailChange();
  }, [token]);

  const verifyEmailChange = async () => {
    try {
      const response = await authAPI.verifyEmailChange(token);
      setSuccess(true);
      setNewEmail(response.new_email || '');

      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      console.error('Email change verification error:', err);
      setError(err.response?.data?.detail || 'Failed to verify email change. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              rappa.ai
            </h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h2>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <Loader size={48} className="mx-auto text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">Verifying your new email address...</p>
            </div>
          )}

          {/* Success Message */}
          {!loading && success && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center text-center gap-4">
                <CheckCircle size={48} className="text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Email Changed Successfully!</h3>
                  <p className="text-sm text-green-700 mt-2">
                    Your email has been updated to:
                  </p>
                  <p className="text-md font-medium text-green-900 mt-1">
                    {newEmail}
                  </p>
                  <p className="text-sm text-green-700 mt-3">
                    Please use your new email address for future logins.
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Redirecting to login page...
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Mail size={20} />
                  Go to Login
                </Link>
              </div>
            </div>
          )}

          {/* Error Message */}
          {!loading && error && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center text-center gap-4">
                <AlertCircle size={48} className="text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Verification Failed</h3>
                  <p className="text-sm text-red-700 mt-2">
                    {error}
                  </p>
                  <p className="text-sm text-red-700 mt-3">
                    The verification link may have expired or already been used.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-center">
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Request a New Email Change
                  </Link>
                </div>
                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-block text-gray-600 hover:text-gray-900"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>&copy; 2025 Rappa.AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
