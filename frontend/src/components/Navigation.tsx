import { Home, FileSearch, MessageCircle, Users, User, Scale, Map } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";

export function Navigation() {
  const { isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: '/', icon: Home, label: 'Home' },
    { id: '/roadmaps', icon: Map, label: 'Roadmaps' },
    { id: '/scanner', icon: FileSearch, label: 'Scanner' },
    { id: '/chatbot', icon: MessageCircle, label: 'AI Lawyer' },
    { id: '/community', icon: Users, label: 'Community' },
    { id: '/profile', icon: User, label: 'Profile' }
  ];

  // If not logged in, only show the Home navigation item
  const visibleNavItems = isLoggedIn ? navItems : navItems.filter(item => item.id === '/');

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-border z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand */}
          <Link 
            to="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Scale size={28} className="text-blue-600" />
            <span className="text-xl font-bold text-foreground">LegalGuide AI</span>
          </Link>

          {/* Navigation + Auth */}
          <div className="flex items-center space-x-4">
            
            {/* Navigation Items */}
            <nav className="flex items-center space-x-1">
              {visibleNavItems.map(({ id, icon: Icon, label }) => {
                // Match exact for home "/", but includes for others like "/roadmaps/category"
                const isActive = id === '/' ? location.pathname === '/' : location.pathname.startsWith(id);
                return (
                  <Link
                    key={id}
                    to={id}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm">{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Login / Logout Button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                  title="Sign Out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}