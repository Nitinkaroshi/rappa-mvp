import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';

// Always load these immediately (small, needed for every page)
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GlobalShortcuts from './components/common/GlobalShortcuts';

// Lazy load heavy/less-frequently-used pages
const Solutions = lazy(() => import('./pages/Solutions'));
const UseCases = lazy(() => import('./pages/UseCases'));
const Features = lazy(() => import('./pages/Features'));
const Contact = lazy(() => import('./pages/Contact'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmailChange = lazy(() => import('./pages/VerifyEmailChange'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Upload = lazy(() => import('./pages/Upload'));
const JobResults = lazy(() => import('./pages/JobResults'));
const Profile = lazy(() => import('./pages/Profile'));
const Credits = lazy(() => import('./pages/Credits'));
const Templates = lazy(() => import('./pages/Templates'));
const Settings = lazy(() => import('./pages/Settings'));
const Documents = lazy(() => import('./pages/Documents'));
const Help = lazy(() => import('./pages/Help'));
const Support = lazy(() => import('./pages/Support'));
const CustomTemplates = lazy(() => import('./pages/CustomTemplates'));
const CreateCustomTemplate = lazy(() => import('./pages/CreateCustomTemplate'));
const Batches = lazy(() => import('./pages/Batches'));
const CreateBatch = lazy(() => import('./pages/CreateBatch'));
const ExportHistory = lazy(() => import('./pages/ExportHistory'));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          containerStyle={{
            zIndex: 99999,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Marketing pages */}
            <Route path="/" element={<><Header /><Home /><Footer /></>} />
            <Route path="/solutions" element={<><Header /><Solutions /><Footer /></>} />
            <Route path="/use-cases" element={<><Header /><UseCases /><Footer /></>} />
            <Route path="/features" element={<><Header /><Features /><Footer /></>} />
            <Route path="/contact" element={<><Header /><Contact /><Footer /></>} />

            {/* Auth pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email-change" element={<VerifyEmailChange />} />

            {/* App pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/jobs/:jobId" element={<JobResults />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/support" element={<Support />} />

            {/* Custom Templates & Batches */}
            <Route path="/custom-templates" element={<CustomTemplates />} />
            <Route path="/custom-templates/create" element={<CreateCustomTemplate />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/create" element={<CreateBatch />} />

            {/* Accounting */}
            <Route path="/export-history" element={<ExportHistory />} />
          </Routes>
        </Suspense>

        <GlobalShortcuts />
      </Router>

    </QueryClientProvider>
  );
}

export default App;
