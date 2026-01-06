#!/bin/bash
# Integration script to connect frontend with backend

echo "Integrating frontend with backend..."

# Create Dashboard.jsx
cat > src/pages/Dashboard.jsx << 'DASH'
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, processingAPI } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const userData = await authAPI.me();
        const jobsData = await processingAPI.getJobs({ limit: 10 });
        setUser(userData);
        setJobs(Array.isArray(jobsData) ? jobsData : jobsData.jobs || []);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const logout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">rappa.ai</h1>
        <div className="flex gap-4">
          <span>{user?.email}</span>
          <span className="bg-indigo-100 px-3 py-1 rounded">{user?.credits} credits</span>
          <button onClick={logout} className="text-gray-600">Logout</button>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Jobs</h2>
          <Link to="/upload" className="bg-indigo-600 text-white px-4 py-2 rounded">Upload</Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-gray-500">No jobs yet</p>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{job.filename}</h3>
                    <p className="text-sm text-gray-500">{new Date(job.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-sm">{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
DASH

# Create Upload.jsx
cat > src/pages/Upload.jsx << 'UPLOAD'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI } from '../services/api';

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    try {
      await uploadAPI.uploadDocument(file, setProgress);
      navigate('/dashboard');
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Upload Document</h1>
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])}
              className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-gray-600">
                {file ? file.name : 'Click to select file'}
              </div>
            </label>
          </div>
          {uploading && <div className="w-full bg-gray-200 rounded"><div className="bg-indigo-600 h-2 rounded" style={{width: progress + '%'}}></div></div>}
          <button type="submit" disabled={!file || uploading}
            className="w-full bg-indigo-600 text-white py-3 rounded disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
    </div>
  );
}
UPLOAD

# Update App.jsx to include new routes
cat > src/App.jsx << 'APPJSX'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Solutions from './pages/Solutions';
import UseCases from './pages/UseCases';
import Features from './pages/Features';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';

function App() {
  return (
    <Router>
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
        
        {/* App pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </Router>
  );
}

export default App;
APPJSX

echo "✅ Frontend integration complete!"
