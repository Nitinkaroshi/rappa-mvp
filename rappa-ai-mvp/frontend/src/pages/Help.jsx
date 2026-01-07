import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import HelpContent from '../components/content/HelpContent';

function Help() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const userData = await authAPI.me();
        setUser(userData);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
      }
    }
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        activePath="/help"
      />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={handleLogout} title="Help Center" />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <HelpContent
              onContactClick={() => navigate('/support')}
              onEmailClick={() => window.location.href = 'mailto:support@rappa.ai'}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Help;
