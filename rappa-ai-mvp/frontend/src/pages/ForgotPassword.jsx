import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Error occurred:', err);
      setError(err.response?.data?.detail || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-primary-100/40 blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl relative z-10 animate-fade-in-up border border-gray-100">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <KeyRound className="text-white h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Forgot Password?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-success-50 border border-success-100 rounded-xl p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mb-3 text-success-600">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Email Sent!</h3>
              <p className="text-sm text-gray-600 mt-2">
                If an account exists for <span className="font-semibold text-gray-900">{email}</span>, you will receive a password reset link shortly.
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Please check your spam folder if it doesn't arrive in a few minutes.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => window.location.href = '/login'}
              icon={<ArrowLeft size={16} />}
            >
              Return to Login
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

            <div className="rounded-md shadow-sm">
              <label htmlFor="email" className="sr-only">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full justify-center py-3 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Send Reset Link
            </Button>

            <div className="flex items-center justify-center">
              <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
