import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, CreditCard, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight, Layers, Package, Keyboard, History } from 'lucide-react';

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
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${isMinimized ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className={`px-6 py-5 border-b border-gray-200 flex items-center ${isMinimized ? 'justify-center' : 'justify-between'}`}>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          {!isMinimized && <span className="text-xl font-bold text-gray-900">rappa.ai</span>}
        </Link>
        {!isMinimized && (
          <button
            onClick={onToggleMinimize}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Minimize sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Minimize button when minimized */}
      {isMinimized && (
        <div className="px-4 py-2 border-b border-gray-200">
          <button
            onClick={onToggleMinimize}
            className="w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight size={20} className="mx-auto" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                title={isMinimized ? item.name : ''}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 ${isMinimized ? 'justify-center' : ''}`}
              >
                <Icon size={20} className="text-gray-400" />
                {!isMinimized && <span>{item.name}</span>}
              </button>
            );
          }

          const active = isActive(item.to);

          return (
            <Link
              key={item.name}
              to={item.to}
              title={isMinimized ? item.name : ''}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${isMinimized ? 'justify-center' : ''}`}
            >
              <Icon size={20} className={active ? 'text-indigo-600' : 'text-gray-400'} />
              {!isMinimized && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-4 py-4 border-t border-gray-200">
        {!isMinimized ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">{user?.credits || 0} credits</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </>
        ) : (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-full flex items-center justify-center p-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
