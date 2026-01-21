
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-primary text-white font-medium shadow-sm'
        : 'text-gray-500 hover:bg-gray-100 hover:text-primary'
    }`}
  >
    <span className="w-5 h-5">{icon}</span>
    <span className="text-sm">{label}</span>
  </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const user = accounts[0];

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard de Cargas';
      case '/restricoes': return 'Restrições de Frota';
      case '/admin': return 'Administração';
      default: return 'T2 - Cacau';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full z-20">
        <div className="p-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-2">
            T2
          </div>
          <h1 className="text-gray-800 font-bold tracking-tight text-lg">Cacau Logistics</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarLink
            to="/"
            label="Dashboard (Cargas)"
            active={location.pathname === '/'}
            icon={
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
              </svg>
            }
          />
          <SidebarLink
            to="/restricoes"
            label="Restrições"
            active={location.pathname === '/restricoes'}
            icon={
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
          <SidebarLink
            to="/admin"
            label="Administração"
            active={location.pathname === '/admin'}
            icon={
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.099-.365.44-.641.821-.641h1.672c.379 0 .722.276.821.641l.248.911c.136.5.647.791 1.144.673l.922-.22a.809.809 0 01.907.34l.835 1.446a.809.809 0 01-.175.97l-.71.556c-.385.302-.505.819-.286 1.258l.128.258a.5.5 0 00.128.258c.219.439.099.956-.286 1.258l-.71.556a.809.809 0 01.175.97l.835 1.446a.809.809 0 01-.907.34l-.922-.22c-.497-.118-1.008.173-1.144.673l-.248.911c-.099.365-.44.641-.821.641h-1.672c-.379 0-.722-.276-.821-.641l-.248-.911c-.136-.5-.647-.791-1.144-.673l-.922.22a.809.809 0 01-.907-.34l-.835-1.446a.809.809 0 01.175-.97l.71-.556c.385-.302.505-.819.286-1.258l-.128-.258a.5.5 0 00-.128-.258c-.219-.439-.099-.956.286-1.258l.71-.556a.809.809 0 01-.175-.97l-.835-1.446a.809.809 0 01.907-.34l.922.22c.497.118 1.008-.173 1.144-.673l.248-.911z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
              {user?.name?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.username || 'user@example.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
