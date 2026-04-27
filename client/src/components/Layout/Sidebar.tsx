import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShieldAlert,
  ActivitySquare,
  Scale,
  Eye,
  FileCheck,
  Menu,
  X,
  Bot,
  Binary,
  Check,
  ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDomain } from '../../context/DomainContext';
import { socket } from '../../services/socket';
import { api } from '../../services/api';

const links = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Analyzer', path: '/analyzer', icon: ActivitySquare },
  { name: 'Interceptor', path: '/interceptor', icon: ShieldAlert },
  { name: 'Compliance', path: '/compliance', icon: Scale },
  { name: 'Audit', path: '/audit', icon: FileCheck },
  { name: 'AI Auditor', path: '/audit-chat', icon: Bot },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isHalted, setIsHalted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { activeDomain, setActiveDomain } = useDomain();

  const domains = [
    { id: 'hiring', label: 'Hiring / Recruitment' },
    { id: 'finance', label: 'Finance / Banking' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'education', label: 'Education' },
    { id: 'government', label: 'Government Services' },
  ];

  useEffect(() => {
    // Initial fetch
    api.getSystemStatus().then(status => {
      setIsHalted(status.halt);
    });

    socket.on('system_status_change', (status: { halt: boolean }) => {
      setIsHalted(status.halt);
    });

    return () => { 
      socket.off('system_status_change');
    };
  }, []);

  return (
    <motion.div
      className={`bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={`p-4 border-b border-neutral-800 flex flex-col gap-4 ${collapsed ? 'items-center' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-white" size={22} />
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">FairAI</h1>
                <p className="text-[10px] text-neutral-500 leading-tight">Guardian Platform</p>
              </div>
            </div>
          )}
          {collapsed && <ShieldAlert className="text-white" size={22} />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-neutral-500 hover:text-white transition-colors p-1"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {!collapsed && (
          <div className="flex flex-col gap-1 relative">
            <label className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider px-1">Active Domain</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-neutral-800 border border-neutral-700 text-sm rounded-md py-1.5 px-3 text-white outline-none focus:border-blue-500 transition-all w-full flex items-center justify-between hover:bg-neutral-700/50"
              >
                <span className="truncate">
                  {domains.find(d => d.id === activeDomain)?.label}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50 p-1"
                    >
                      {domains.map((domain) => (
                        <button
                          key={domain.id}
                          onClick={() => {
                            setActiveDomain(domain.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors ${
                            activeDomain === domain.id
                              ? 'bg-blue-600/10 text-white'
                              : 'text-neutral-400 hover:bg-neutral-700/50 hover:text-white'
                          }`}
                        >
                          <div className="w-4 flex items-center justify-center">
                            {activeDomain === domain.id && <Check size={14} className="text-white" />}
                          </div>
                          <span className="truncate">{domain.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {

          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              title={link.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-transparent'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon size={20} />
              {!collapsed && <span className="font-medium text-sm">{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800">
        <div className={`bg-neutral-800/60 p-3 rounded-lg flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <span className="text-xs text-neutral-400">System</span>}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isHalted ? 'bg-rose-500' : 'bg-emerald-500'} ${!isHalted && 'animate-pulse'}`}></span>
            {!collapsed && (
              <span className={`text-xs font-medium ${isHalted ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isHalted ? 'Halted' : 'Active'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
