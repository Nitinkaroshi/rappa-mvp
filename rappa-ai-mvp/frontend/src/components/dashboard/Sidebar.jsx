import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, CreditCard, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight, Layers, Package, Keyboard, History, Zap } from 'lucide-react';
import Badge from '../ui/Badge';

export default function Sidebar({ user, onLogout, isMinimized, onToggleMinimize }) {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', to: '/documents', icon: FileText },
    { name: 'Upload', to: '/upload', icon: Upload },
    { name: 'Custom Templates', to: '/custom-templates', icon: Layers },
    { name: 'Batches', to: '/batches', icon: Package },
    { name: 'Export History', to: '/export-history', icon: History },
    { name: 'Credits', to: '/credits', icon: CreditCard },
    { name: 'Settings', to: '/settings', icon: Settings },
    { name: 'Shortcuts', icon: Keyboard, onClick: () => window.dispatchEvent(new CustomEvent('open-shortcuts-help')) },
    { name: 'Help', to: '/help', icon: HelpCircle },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ${isMinimized ? 'w-20' : 'w-64'}`}>
      {/* Logo Section */}
      <div className={`px-6 py-5 border-b border-gray-200 flex items-center ${isMinimized ? 'justify-center' : 'justify-between'}`}>
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          {!isMinimized && (
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">rappa</span>
              <span className="text-xl font-bold text-gradient-primary">.ai</span>
            </div>
          )}
        </Link>
        {!isMinimized && (
          <button
            onClick={onToggleMinimize}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Minimize sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Minimize button when minimized */}
      {isMinimized && (
        <div className="px-4 py-2 border-b border-gray-200">
          <button
            onClick={onToggleMinimize}
            className="w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Expand sidebar"
          >
            <ChevronRight size={18} className="mx-auto" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                title={isMinimized ? item.name : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 ${isMinimized ? 'justify-center' : ''}`}
              >
                <Icon size={20} className="text-gray-500 flex-shrink-0" />
                {!isMinimized && <span className="text-sm font-medium">{item.name}</span>}
              </button>
            );
          }

          const active = isActive(item.to);

          return (
            <Link
              key={item.name}
              to={item.to}
              title={isMinimized ? item.name : ''}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${active
                  ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${isMinimized ? 'justify-center' : ''}`}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-500'}`}
              />
              {!isMinimized && <span className="text-sm font-medium">{item.name}</span>}
              {!isMinimized && active && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-gray-200 bg-gray-50">
        {!isMinimized ? (
          <>
            {/* User Profile Card */}
            <div className="bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Credits Badge */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-600">Credits</span>
                <Badge variant="primary" size="sm">
                  {user?.credits || 0}
                </Badge>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-error-50 hover:text-error-600 rounded-lg transition-all duration-200 border border-gray-200 hover:border-error-200"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </>
        ) : (
          <>
            {/* Minimized User Avatar */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>

            {/* Minimized Logout Button */}
            <button
              onClick={onLogout}
              title="Logout"
              className="w-full flex items-center justify-center p-2.5 text-gray-700 hover:bg-error-50 hover:text-error-600 rounded-lg transition-all duration-200 border border-gray-200 hover:border-error-200"
            >
              <LogOut size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
