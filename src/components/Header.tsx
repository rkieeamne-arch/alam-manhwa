import React, { useState } from 'react';
import { 
  Search, BookOpen, User, ShieldAlert, History, Home, Sparkles, Heart, FolderDown, Tv, MessageSquare 
} from 'lucide-react';
import { UserProfile } from '../types';
import logoImg from '../assets/images/manhua_logo_1783758713519.jpg';

interface HeaderProps {
  onOpenSettings: () => void;
  user: UserProfile | null;
  onNavigate: (view: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists' | 'downloads') => void;
  currentView: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists' | 'downloads';
  onSearch: (query: string) => void;
  homeLayout?: 'classic' | 'modern';
  appMode?: 'manga' | 'anime';
  onToggleAppMode?: () => void;
}

export default function Header({
  onOpenSettings,
  user,
  onNavigate,
  currentView,
  onSearch,
  homeLayout = 'modern',
  appMode = 'manga',
  onToggleAppMode
}: HeaderProps) {
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
    onNavigate('search');
  };

  const isAnime = appMode === 'anime';

  return (
    <header className="z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        
        {/* Main top row: Center title with Settings trigger, Left buttons, Right spacer (Responsive design) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          
          {/* Column 1: Spacer or Quick Info on mobile */}
          <div className="order-2 md:order-1 hidden md:block"></div>

          {/* Column 2: Centered Website Logo & App Mode Switcher (Strictly in Center) */}
          <div className="order-1 md:order-2 flex flex-col items-center justify-center gap-2 py-1">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Logo text & emblem */}
              <div 
                onClick={() => onNavigate('home')} 
                className="cursor-pointer flex items-center gap-2 group select-none justify-center"
              >
                <div className={`w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center shadow-md group-hover:scale-105 transition-all ${isAnime ? 'border-amber-500 shadow-amber-900/30' : 'border-red-500 shadow-red-900/30'}`}>
                  <img src={logoImg} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h1 className={`text-xl md:text-2xl font-black text-white tracking-tight font-display transition-colors ${isAnime ? 'group-hover:text-amber-500' : 'group-hover:text-red-500'}`}>
                  عالم <span className={`${isAnime ? 'text-amber-500' : 'text-red-500'} font-extrabold`}>{isAnime ? 'الأنمي' : 'المانهو'}</span>
                </h1>
              </div>
            </div>
            
            <span className="text-[9px] text-zinc-500 font-medium tracking-widest hidden md:block text-center">
              {isAnime ? 'عش شغف الأنمي والكرتون • بجودة فائقة السرعة' : 'عش شغف المانهو والمانجا • بجودة فائقة السرعة'}
            </span>
          </div>

          {/* Column 3: Quick Info / User account badge (ordered last) */}
          <div className="order-3 hidden md:flex items-center justify-end gap-3">
            {user ? (
              <div 
                onClick={() => onNavigate('account')}
                className={`flex items-center gap-2 p-1.5 px-3 rounded-full bg-zinc-900 border hover:border-opacity-100 cursor-pointer transition-all ${isAnime ? 'border-zinc-800 hover:border-amber-500' : 'border-zinc-800 hover:border-red-500'}`}
                id="header-user-badge"
              >
                <img 
                  src={user.avatarUrl || undefined} 
                  alt={user.displayName}
                  className={`w-6 h-6 rounded-full border object-cover ${isAnime ? 'border-amber-500' : 'border-red-500'}`}
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
                <User className={`w-3.5 h-3.5 ${isAnime ? 'text-amber-500' : 'text-red-500'}`} />
                دخول السريع
              </button>
            )}

            {user && user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`p-2 rounded-full transition-colors ${isAnime ? 'bg-amber-950/20 hover:bg-amber-950/50 text-amber-400 hover:text-amber-300 border border-amber-900/30' : 'p-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 border border-red-900/30'}`}
                title="لوحة الإدارة"
                id="header-admin-quick"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* NAVIGATION BAR - Beautiful Bottom-Row Navigation Links */}
        <nav className={`mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-4 px-2 md:px-0 pb-1 ${homeLayout === 'modern' ? 'hidden md:flex' : 'flex'}`} dir="rtl">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'home'
                ? isAnime
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-red-600 text-white shadow-md shadow-red-900/20'
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
                ? isAnime
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-explore-btn"
          >
            <Search className="w-3.5 h-3.5" />
            {isAnime ? 'قائمة الأنمي' : 'قائمة المانهو'}
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'history'
                ? isAnime
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-history-btn"
          >
            <History className="w-3.5 h-3.5" />
            {isAnime ? 'سجل المشاهدة' : 'سجل القراءة'}
          </button>

          <button
            onClick={() => onNavigate('mylists')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'mylists'
                ? isAnime
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-mylists-btn"
          >
            <Heart className="w-3.5 h-3.5" />
            قائمتي
          </button>

          <button
            onClick={() => onNavigate('downloads')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'downloads'
                ? isAnime
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
            id="nav-downloads-btn"
          >
            <FolderDown className="w-3.5 h-3.5" />
            التحميلات
          </button>

          <button
            onClick={() => onNavigate('account')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'account'
                ? isAnime
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-red-600 text-white shadow-md shadow-red-900/20'
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
                  ? isAnime
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-red-600 text-white shadow-md shadow-red-900/20'
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
