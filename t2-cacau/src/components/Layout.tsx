import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Truck, AlertTriangle, Settings, Menu, X, LayoutDashboard } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
          isActive
            ? 'bg-brand-500 text-white shadow-md'
            : 'text-gray-600 hover:bg-brand-100 hover:text-brand-700'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
};

export const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-md flex items-center justify-center text-white font-bold">T2</div>
            <span className="font-bold text-gray-800">T2 - Cacau</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                <Truck size={18} />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">T2 - Cacau</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <SidebarItem to="/" icon={LayoutDashboard} label="Cargas" />
            <SidebarItem to="/restricoes" icon={AlertTriangle} label="Restrições" />
            <SidebarItem to="/admin" icon={Settings} label="Admin" />
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="bg-brand-50 p-4 rounded-xl">
              <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider mb-1">Status do Sistema</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm text-gray-600 font-medium">Operacional</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full pt-16 lg:pt-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-800">
                {location.pathname === '/' && 'Gestão de Cargas'}
                {location.pathname === '/restricoes' && 'Restrições'}
                {location.pathname === '/admin' && 'Administração'}
            </h1>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 text-sm font-medium">
                    US
                </div>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};