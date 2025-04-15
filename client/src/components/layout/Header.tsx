import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import { DateRangeOption } from "@/lib/dateUtils";

interface HeaderProps {
  toggleSidebar: () => void;
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
}

export default function Header({ toggleSidebar, dateRange, setDateRange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#userMenuButton') && !target.closest('#userMenu')) {
      setUserMenuOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10" onClick={handleClickOutside}>
      <div className="flex justify-between items-center px-4 py-3 lg:px-6">
        <div className="flex items-center space-x-2">
          <button 
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleSidebar}
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="text-xl font-semibold text-gray-800 ml-2">DashMetrics</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="hidden md:block">
            <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button 
              className="flex items-center" 
              id="userMenuButton"
              onClick={toggleUserMenu}
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {getInitials(user?.username || user?.email || '')}
                  </span>
                )}
              </div>
              <i className="ri-arrow-down-s-line ml-1 text-gray-500"></i>
            </button>
            
            {userMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1" 
                id="userMenu"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Profile
                </a>
                <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Settings
                </a>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
