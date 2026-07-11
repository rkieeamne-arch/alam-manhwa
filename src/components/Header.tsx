import React, { useState } from 'react';
import { 
  Search, BookOpen, User, ShieldAlert, History, Home, Sparkles, Heart 
} from 'lucide-react';
import { UserProfile } from '../types';
import logoImg from '../assets/images/manhua_logo_1783758713519.jpg';

interface HeaderProps {
  onOpenSettings: () => void;
  user: UserProfile | null;
  onNavigate: (view: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists') => void;
  currentView: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists';
  onSearch: (query: string) => void;
}

export default function Header({
  onOpenSettings,
  user,
  onNavigate,
  currentView,
  onSearch
}: HeaderProps) {
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
    onNavigate('search');
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        
        {/* Main top row: Center title with Settings trigger, Left buttons, Right search (Responsive design) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          
          {/* Column 1: Search bar (aligned right/first on RTL) */}
          <form onSubmit={handleSearchSubmit} className="order-2 md:order-1 flex items-center relative w-full max-w-sm">
            <input
              type="text"
              placeholder="ابحث عن مانهو بالاسم أو الكاتب..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 rounded-full py-2 px-4 pl-10 focus:outline-none focus:border-red-600 transition-colors"
              id="header-search-input"
            />
            <button
              type="submit"
              className="absolute left-3 p-1 text-zinc-400 hover:text-red-500 transition-colors"
              id="header-search-submit-btn"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Column 2: Centered Website Logo & Settings Trigger (Strictly in Center) */}
          <div className="order-1 md:order-2 flex flex-col items-center justify-center gap-1 py-1">
            <div className="flex items-center gap-2.5">
              {/* Logo text & emblem */}
              <div 
                onClick={() => onNavigate('home')} 
                className="cursor-pointer flex items-center gap-2 group select-none"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-red-500 flex items-center justify-center shadow-md shadow-red-900/30 group-hover:scale-105 transition-all">
                  <img src={logoImg} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight font-display transition-colors group-hover:text-red-500">
                  عالم <span className="text-red-500 font-extrabold">المانهو</span>
                </h1>
              </div>

              {/* Discord Button and Settings Trigger */}
              <div className="flex items-center gap-2">
                <a
                  href="https://discord.gg/NM59xtZtX3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white border border-indigo-500/30 hover:border-indigo-600 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="تواصل عبر ديسكورد"
                >
                  <span>ديسكورد</span>
                </a>
              </div>
            </div>
            
            <span className="text-[9px] text-zinc-500 font-medium tracking-widest hidden md:block">
              عش شغف المانهو • بجودة فائقة السرعة
            </span>
          </div>

          {/* Column 3: Quick Info / User account badge (ordered last) */}
          <div className="order-3 hidden md:flex items-center justify-end gap-3">
            {user ? (
              <div 
                onClick={() => onNavigate('account')}
                className="flex items-center gap-2 p-1.5 px-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-red-500/50 cursor-pointer transition-all"
                id="header-user-badge"
              >
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName}
                  className="w-6 h-6 rounded-full border border-red-500 object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-zinc-300 truncate max-w-[120px]">
                  {user.displayName}
                </span>
              </div>
            ) : (
              <button 
                onClick={onOpenSettings}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 border border-zinc-800 hover:border-zinc-700 rounded-full transition-colors flex items-center gap-1"
                id="header-login-quick"
              >
                <User className="w-3.5 h-3.5 text-red-500" />
                دخول السريع
              </button>
            )}

            {user && user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="p-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 border border-red-900/30 rounded-full transition-colors"
                title="لوحة الإدارة"
                id="header-admin-quick"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* NAVIGATION BAR - Beautiful Bottom-Row Navigation Links */}
        <nav className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-4 px-2 md:px-0 pb-1" dir="rtl">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'home'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-home-btn"
          >
            <Home className="w-3.5 h-3.5" />
            الرئيسية
          </button>

          <button
            onClick={() => onNavigate('search')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'search'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-explore-btn"
          >
            <Search className="w-3.5 h-3.5" />
            قائمة المانهو
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'history'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-history-btn"
          >
            <History className="w-3.5 h-3.5" />
            سجل القراءة
          </button>

          <button
            onClick={() => onNavigate('mylists')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'mylists'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-mylists-btn"
          >
            <Heart className="w-3.5 h-3.5" />
            قائمتي
          </button>

          <button
            onClick={() => onNavigate('account')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'account'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-account-btn"
          >
            <User className="w-3.5 h-3.5" />
            الحساب الشخصي
          </button>

          {user && user.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'admin'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
              id="nav-admin-btn"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              لوحة الإدارة
            </button>
          )}
        </nav>

      </div>
    </header>
  );
}
