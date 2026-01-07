import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Bell, Lock, CreditCard, Globe, Save } from 'lucide-react';
import { authAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { Card, Button, Badge } from '../components/ui';

function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Initialize tab from URL or default to 'profile'
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state with URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        activePath="/settings"
      />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={handleLogout} title="Settings" />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account profile, preferences, and improvements</p>
            </div>

            <Card className="min-h-[600px] flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                            ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200'
                            : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                          }`}
                      >
                        <Icon size={18} className={isActive ? 'text-primary-600' : 'text-gray-400'} />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 md:p-8">
                {activeTab === 'profile' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                      <p className="text-sm text-gray-500">Update your account's profile information and email address.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" defaultValue={user?.full_name || "John Doe"} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" defaultValue={user?.email || "john@example.com"} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Company</label>
                        <input type="text" placeholder="Acme Inc." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        <input type="tel" placeholder="+1 (555) 123-4567" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-gray-100">
                      <Button variant="primary" icon={<Save size={18} />}>Save Changes</Button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
                      <p className="text-sm text-gray-500">Choose what you want to be notified about.</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Email notifications for completed jobs', desc: 'Receive an email when your document processing is complete' },
                        { label: 'Weekly summary emails', desc: 'Get a weekly summary of your document processing activity' },
                        { label: 'Marketing emails', desc: 'Receive updates about new features and promotions' },
                        { label: 'Security alerts', desc: 'Get notified about important security updates' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-200 transition-colors">
                          <input type="checkbox" defaultChecked={idx < 2} className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                          <div>
                            <label className="font-medium text-gray-900 block">{item.label}</label>
                            <span className="text-sm text-gray-500">{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-6 border-t border-gray-100">
                      <Button variant="primary" icon={<Save size={18} />}>Save Preferences</Button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
                      <p className="text-sm text-gray-500">Manage your password and security questions.</p>
                    </div>
                    <div className="space-y-6 max-w-md">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Current Password</label>
                          <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">New Password</label>
                          <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                          <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all" />
                        </div>
                      </div>
                      <Button variant="primary" icon={<Save size={18} />}>Update Password</Button>
                    </div>
                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
                        </div>
                        <Button variant="outline">Enable 2FA</Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Billing & Subscription</h2>
                      <p className="text-sm text-gray-500">Manage your subscription plan and payment details.</p>
                    </div>
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-primary-100 text-sm font-medium mb-1">Current Plan</p>
                          <h3 className="text-2xl font-bold">Free Tier</h3>
                          <p className="text-primary-100 mt-2">10 credits / month</p>
                        </div>
                        <Badge variant="white" className="text-primary-700">Active</Badge>
                      </div>
                      <div className="mt-6 pt-6 border-t border-primary-500/30 flex gap-3">
                        <button className="px-4 py-2 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm">Upgrade Plan</button>
                        <button className="px-4 py-2 bg-primary-800 text-white font-semibold rounded-lg hover:bg-primary-900 transition-colors text-sm">View Invoices</button>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Payment Methods</h3>
                      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                          <CreditCard className="text-gray-400" size={24} />
                        </div>
                        <p className="text-gray-500 text-sm">No payment methods added yet</p>
                        <Button variant="outline" size="sm" className="mt-4">Add Payment Method</Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
                      <p className="text-sm text-gray-500">Customize your experience.</p>
                    </div>
                    <div className="space-y-6 max-w-md">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Language</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all">
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Timezone</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all">
                          <option>UTC-8 (Pacific Time)</option>
                          <option>UTC+0 (GMT)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date Format</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all">
                          <option>MM/DD/YYYY</option>
                          <option>DD/MM/YYYY</option>
                        </select>
                      </div>
                      <div className="pt-4">
                        <Button variant="primary" icon={<Save size={18} />}>Save Preferences</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
