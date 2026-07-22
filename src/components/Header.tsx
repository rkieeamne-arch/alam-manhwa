import React, { useState } from 'react';
import { 
  Search, BookOpen, User, ShieldAlert, History, Home, Sparkles, Heart, FolderDown, Tv, MessageSquare,
  Sun, Moon, Bell, BellOff, Check, Trash2, Globe
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';
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
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  notifications?: NotificationItem[];
  onNotificationClick?: (notif: NotificationItem) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
}

export default function Header({
  onOpenSettings,
  user,
  onNavigate,
  currentView,
  onSearch,
  homeLayout = 'modern',
  appMode = 'manga',
  onToggleAppMode,
  isNightMode = true,
  onToggleNightMode = () => {},
  notifications = [],
  onNotificationClick = () => {},
  onMarkAllNotificationsRead = () => {},
  onClearAllNotifications = () => {},
  onDeleteNotification = () => {}
}: HeaderProps) {
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTab, setNotifTab] = useState<'manga' | 'anime' | 'site'>('manga');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
    onNavigate('search');
  };

  const isAnime = appMode === 'anime';
  const unreadCount = notifications.filter(n => n.isNew).length;
  const filteredNotifications = notifications.filter(n => n.type === notifTab);

  return (
    <header className="z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        
        {/* Main top row: Center title with Settings trigger, Left buttons, Right spacer (Responsive design) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          
          {/* Column 1: Spacer or Quick Info on mobile */}
          <div className="order-2 md:order-1 hidden md:block"></div>

          {/* Column 2: Centered Website Logo & App Mode Switcher (Strictly in Center) */}
          <div className="order-1 md:order-2 flex flex-col items-center justify-center gap-2 py-1">
            <div className="flex items-center justify-center gap-4 sm:gap-6 w-full max-w-md relative">
              
              {/* Day Mode / Night Mode Toggle (X mark on the left) */}
              <button
                onClick={onToggleNightMode}
                className={`p-2.5 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
                  !isNightMode
                    ? 'bg-amber-100 border-amber-300 text-amber-600 shadow-amber-200/50 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40'
                }`}
                title={isNightMode ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
                id="header-theme-toggle-btn"
              >
                {!isNightMode ? (
                  <Sun className="w-4 h-4 fill-amber-500 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Logo text & emblem */}
              <div 
                onClick={() => onNavigate('home')} 
                className="cursor-pointer flex items-center gap-2 group select-none justify-center"
              >
                <div className={`w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center shadow-md group-hover:scale-105 transition-all ${isAnime ? 'border-amber-500 shadow-amber-900/30' : 'border-red-500 shadow-red-900/30'}`}>
                  <img src={logoImg || undefined} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h1 className={`text-xl md:text-2xl font-black text-white tracking-tight font-display transition-colors ${isAnime ? 'group-hover:text-amber-500' : 'group-hover:text-red-500'}`}>
                  عالم <span className={`${isAnime ? 'text-amber-500' : 'text-red-500'} font-extrabold`}>{isAnime ? 'الأنمي' : 'المانهو'}</span>
                </h1>
              </div>

              {/* Notification Button & Panel (Circle mark on the right) */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center relative ${
                    showNotifications
                      ? isAnime 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                        : 'bg-red-500/10 border-red-500 text-red-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-500/40'
                  }`}
                  title="الإشعارات والتحديثات"
                  id="header-notifications-toggle-btn"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-bounce border border-zinc-950">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown panel */}
                {showNotifications && (
                  <div 
                    className="absolute -left-3 sm:left-0 mt-3 w-[calc(100vw-1.5rem)] sm:w-96 bg-zinc-950/95 border border-zinc-800/85 backdrop-blur-lg rounded-2xl shadow-2xl z-50 overflow-hidden text-right"
                    id="notifications-dropdown-menu"
                    dir="rtl"
                  >
                    {/* Panel Header */}
                    <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-extrabold text-zinc-200">صندوق الإشعارات</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-600/20 text-red-500 text-[9px] font-black rounded-md">
                            {unreadCount} جديد
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAllNotificationsRead();
                            }}
                            className="p-1 text-zinc-400 hover:text-green-500 transition-colors cursor-pointer"
                            title="تحديد الكل كمقروء"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearAllNotifications();
                            }}
                            className="p-1 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="مسح كافة الإشعارات"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-zinc-900/40 p-1 border-b border-zinc-900 gap-1">
                      <button
                        onClick={() => setNotifTab('manga')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          notifTab === 'manga'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                        }`}
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>مانهو ({notifications.filter(n => n.type === 'manga').length})</span>
                      </button>
                      
                      <button
                        onClick={() => setNotifTab('anime')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          notifTab === 'anime'
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                        }`}
                      >
                        <Tv className="w-3 h-3" />
                        <span>أنمي ({notifications.filter(n => n.type === 'anime').length})</span>
                      </button>

                      <button
                        onClick={() => setNotifTab('site')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          notifTab === 'site'
                            ? 'bg-pink-600 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>موقع ({notifications.filter(n => n.type === 'site').length})</span>
                      </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-900">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              onNotificationClick(notif);
                              setShowNotifications(false);
                            }}
                            className={`p-3 flex gap-3 hover:bg-zinc-900/50 transition-colors cursor-pointer items-start relative select-none ${
                              notif.isNew ? 'bg-red-500/[0.02]' : ''
                            }`}
                          >
                            {/* Unread dot indicator */}
                            {notif.isNew && (
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            )}
                            
                            {/* Media thumbnail cover */}
                            <div className="w-9 h-12 rounded bg-zinc-900 shrink-0 overflow-hidden border border-zinc-800 mr-2 flex items-center justify-center">
                              {notif.cover ? (
                                <img 
                                  src={notif.cover || undefined} 
                                  alt={notif.title} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {notif.type === 'anime' ? (
                                    <Tv className="w-4 h-4 text-amber-500" />
                                  ) : notif.type === 'site' ? (
                                    <Globe className="w-4 h-4 text-pink-400" />
                                  ) : (
                                    <BookOpen className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Text info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-[11px] font-extrabold text-zinc-100 truncate">
                                  {notif.title}
                                </h4>
                                <span className="text-[8px] text-zinc-500 shrink-0">{notif.time}</span>
                              </div>
                              <p className="text-[10px] text-zinc-400 leading-snug mt-1 font-medium">
                                {notif.content}
                              </p>
                              {notif.chapterOrEp ? (
                                <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  notif.type === 'anime' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-600/10 text-red-500'
                                }`}>
                                  {notif.type === 'anime' ? `الحلقة ${notif.chapterOrEp}` : `الفصل ${notif.chapterOrEp}`}
                                </span>
                              ) : notif.type === 'site' ? (
                                <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400">
                                  إشعار موقع
                                </span>
                              ) : null}
                            </div>

                            {/* Delete single notification button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification(notif.id);
                              }}
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors shrink-0 self-center"
                              title="حذف هذا الإشعار"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                          <BellOff className="w-8 h-8 text-zinc-700 stroke-1" />
                          <p className="text-[10px] font-bold">لا توجد إشعارات جديدة حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                className={`p-2 rounded-full transition-colors ${isAnime ? 'bg-amber-950/20 hover:bg-amber-950/50 text-amber-400 hover:text-amber-300 border border-amber-900/30' : 'bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 border border-red-900/30'}`}
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
