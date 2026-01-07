import { Bell, Search, Menu } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import Badge from '../ui/Badge';

export default function DashboardHeader({ user, onLogout, title = 'Dashboard', onMenuClick }) {
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: Menu button (mobile) + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-all duration-200"
          >
            <Menu size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <Badge variant="primary" size="sm">Live</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {getGreeting()}, {user?.email?.split('@')[0] || 'User'} • {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* Search (hidden on mobile) */}
          <div className="hidden md:block">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all duration-200 bg-gray-50 hover:bg-white"
              />
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Profile Menu */}
          <ProfileMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
