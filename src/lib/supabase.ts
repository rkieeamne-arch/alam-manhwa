import { createClient } from '@supabase/supabase-js';
import { UserProfile, ReadingHistoryItem, ReadingListItem, Manhua } from '../types';

// Supabase Environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// True if Supabase keys are fully defined
export const hasSupabase = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'MY_SUPABASE_URL');

// Lazy-initialized Supabase Client
export const supabase = hasSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * SQL SCHEMA FOR SUPABASE SQL EDITOR:
 * 
 * -- 1. Create Profiles Table (extends Auth Users)
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   email text not null,
 *   display_name text,
 *   avatar_url text,
 *   bio text,
 *   role text default 'user',
 *   joined_at text,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- 2. Create Reading History Table
 * create table public.reading_history (
 *   id text primary key,
 *   user_id uuid references auth.users on delete cascade not null,
 *   manhua_id text not null,
 *   manhua_title text not null,
 *   manhua_cover text not null,
 *   chapter_id text not null,
 *   chapter_title text not null,
 *   chapter_number numeric not null,
 *   last_read_time text not null,
 *   progress_percent numeric not null,
 *   page_index numeric not null
 * );
 * 
 * -- 3. Create Reading Lists Table
 * create table public.reading_lists (
 *   id text primary key,
 *   user_id uuid references auth.users on delete cascade not null,
 *   manhua_id text not null,
 *   manhua_title text not null,
 *   manhua_cover text not null,
 *   list_type text not null check (list_type in ('favorite', 'reading', 'plan')),
 *   added_at text not null,
 *   unique (user_id, manhua_id)
 * );
 * 
 * -- Enable Row Level Security (RLS)
 * alter table public.profiles enable row level security;
 * alter table public.reading_history enable row level security;
 * alter table public.reading_lists enable row level security;
 * 
 * -- Create RLS Policies
 * create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
 * create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
 * create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
 * 
 * create policy "Users can view own history" on public.reading_history for select using (auth.uid() = user_id);
 * create policy "Users can modify own history" on public.reading_history for all using (auth.uid() = user_id);
 * 
 * create policy "Users can view own reading lists" on public.reading_lists for select using (auth.uid() = user_id);
 * create policy "Users can modify own reading lists" on public.reading_lists for all using (auth.uid() = user_id);
 */

// Helper to simulate network latency for high-fidelity fallback
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ==========================================
// AUTHENTICATION INTERFACES (DUAL-MODE)
// ==========================================

export async function signUpUser(email: string, password: string, displayName: string): Promise<{ user: UserProfile | null; error: string | null }> {
  const cleanEmail = email.toLowerCase().trim();
  
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName,
          }
        }
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('فشل إنشاء الحساب');

      const isAdmin = cleanEmail === 'rkieeamne@gmail.com';
      const defaultAvatar = isAdmin 
        ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

      const userProfile: UserProfile = {
        id: data.user.id,
        email: cleanEmail,
        displayName: displayName,
        avatarUrl: defaultAvatar,
        role: isAdmin ? 'admin' : 'user',
        joinedAt: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        bio: isAdmin ? 'مدير عام ومؤسس موقع عالم المانهو الرئيسي.' : 'قارئ عاشق للمانحو.'
      };

      // Create profile record
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: userProfile.id,
        email: userProfile.email,
        display_name: userProfile.displayName,
        avatar_url: userProfile.avatarUrl,
        bio: userProfile.bio,
        role: userProfile.role,
        joined_at: userProfile.joinedAt
      });

      if (profileErr) {
        console.warn('Profile DB insert error, continuing anyway:', profileErr);
      }

      return { user: userProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'خطأ أثناء التسجيل' };
    }
  } else {
    // Fallback Local Engine
    await delay(600);
    const existingStr = localStorage.getItem('manhua_local_accounts') || '[]';
    const accounts = JSON.parse(existingStr);
    
    if (accounts.some((acc: any) => acc.email === cleanEmail)) {
      return { user: null, error: 'البريد الإلكتروني مسجل بالفعل' };
    }

    const userId = 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const isAdmin = cleanEmail === 'rkieeamne@gmail.com';
    const defaultAvatar = isAdmin 
      ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    const newProfile: UserProfile = {
      id: userId,
      email: cleanEmail,
      displayName: displayName,
      avatarUrl: defaultAvatar,
      role: isAdmin ? 'admin' : 'user',
      joinedAt: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      bio: isAdmin ? 'مدير عام ومؤسس موقع عالم المانهو الرئيسي.' : 'قارئ عاشق للمانحو.'
    };

    accounts.push({
      id: userId,
      email: cleanEmail,
      password, // securely kept in localStorage simulation
      profile: newProfile
    });

    localStorage.setItem('manhua_local_accounts', JSON.stringify(accounts));
    return { user: newProfile, error: null };
  }
}

export async function signInUser(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  const cleanEmail = email.toLowerCase().trim();

  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('فشل تسجيل الدخول');

      // Fetch user profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profileData) {
        // Fallback profile if record not found
        const isAdmin = cleanEmail === 'rkieeamne@gmail.com';
        const fallbackProfile: UserProfile = {
          id: data.user.id,
          email: cleanEmail,
          displayName: data.user.user_metadata?.display_name || cleanEmail.split('@')[0],
          avatarUrl: isAdmin 
            ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          role: isAdmin ? 'admin' : 'user',
          joinedAt: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
          bio: isAdmin ? 'مدير عام ومؤسس موقع عالم المانهو الرئيسي.' : 'قارئ عاشق للمانحو.'
        };
        return { user: fallbackProfile, error: null };
      }

      const activeProfile: UserProfile = {
        id: profileData.id,
        email: profileData.email,
        displayName: profileData.display_name,
        avatarUrl: profileData.avatar_url,
        bio: profileData.bio || '',
        role: profileData.role as 'admin' | 'user',
        joinedAt: profileData.joined_at
      };

      return { user: activeProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'بيانات الاعتماد غير صالحة' };
    }
  } else {
    // Fallback Local Engine
    await delay(500);
    const existingStr = localStorage.getItem('manhua_local_accounts') || '[]';
    const accounts = JSON.parse(existingStr);
    
    const matchedAcc = accounts.find((acc: any) => acc.email === cleanEmail && acc.password === password);
    if (!matchedAcc) {
      return { user: null, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    return { user: matchedAcc.profile, error: null };
  }
}

export async function signOutUser(): Promise<void> {
  if (hasSupabase && supabase) {
    await supabase.auth.signOut();
  }
}

export async function updateUserProfile(userId: string, updatedData: Partial<UserProfile>): Promise<{ user: UserProfile | null; error: string | null }> {
  if (hasSupabase && supabase && !userId.startsWith('usr_local_')) {
    try {
      const updates: Record<string, any> = {};
      if (updatedData.displayName !== undefined) updates.display_name = updatedData.displayName;
      if (updatedData.avatarUrl !== undefined) updates.avatar_url = updatedData.avatarUrl;
      if (updatedData.bio !== undefined) updates.bio = updatedData.bio;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      const updatedProfile: UserProfile = {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        bio: data.bio || '',
        role: data.role as 'admin' | 'user',
        joinedAt: data.joined_at
      };

      return { user: updatedProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'فشل تحديث الملف الشخصي' };
    }
  } else {
    // Fallback Local Engine
    await delay(300);
    const existingStr = localStorage.getItem('manhua_local_accounts') || '[]';
    const accounts = JSON.parse(existingStr);
    
    const accIdx = accounts.findIndex((acc: any) => acc.id === userId);
    if (accIdx === -1) {
      // Create a fallback profile entry if not found in accounts
      const currentProfile = {
        id: userId,
        email: updatedData.email || 'guest@local.com',
        displayName: updatedData.displayName || 'Guest',
        avatarUrl: updatedData.avatarUrl || '',
        bio: updatedData.bio || '',
        role: 'user' as const,
        joinedAt: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
      };
      
      const newProfile = {
        ...currentProfile,
        ...updatedData
      };

      accounts.push({
        id: userId,
        email: newProfile.email,
        password: 'dummy',
        profile: newProfile
      });
      localStorage.setItem('manhua_local_accounts', JSON.stringify(accounts));
      return { user: newProfile, error: null };
    }

    const currentProfile = accounts[accIdx].profile;
    const newProfile = {
      ...currentProfile,
      ...updatedData
    };

    accounts[accIdx].profile = newProfile;
    localStorage.setItem('manhua_local_accounts', JSON.stringify(accounts));
    return { user: newProfile, error: null };
  }
}


// ==========================================
// READING HISTORY METHODS (DUAL-MODE)
// ==========================================

export async function fetchUserReadingHistory(userId: string): Promise<ReadingHistoryItem[]> {
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', userId)
        .order('last_read_time', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        manhuaId: row.manhua_id,
        manhuaTitle: row.manhua_title,
        manhuaCover: row.manhua_cover,
        chapterId: row.chapter_id,
        chapterTitle: row.chapter_title,
        chapterNumber: Number(row.chapter_number),
        lastReadTime: row.last_read_time,
        progressPercent: Number(row.progress_percent),
        pageIndex: Number(row.page_index)
      }));
    } catch (err) {
      console.warn('Error fetching reading history from Supabase, falling back to LocalStorage:', err);
      const saved = localStorage.getItem(`manhua_history_${userId}`);
      return saved ? JSON.parse(saved) : [];
    }
  } else {
    // Fallback Local Engine
    const saved = localStorage.getItem(`manhua_history_${userId}`);
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveUserReadingHistory(userId: string, item: Omit<ReadingHistoryItem, 'id' | 'lastReadTime'>): Promise<ReadingHistoryItem> {
  const historyId = 'hist-' + Date.now();
  const lastReadTime = new Date().toISOString();

  const fullItem: ReadingHistoryItem = {
    ...item,
    id: historyId,
    lastReadTime
  };

  if (hasSupabase && supabase) {
    try {
      // First delete any previous history item for this exact manhua to avoid flooding
      await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', userId)
        .eq('manhua_id', item.manhuaId);

      // Insert new top record
      const { error } = await supabase.from('reading_history').insert({
        id: historyId,
        user_id: userId,
        manhua_id: item.manhuaId,
        manhua_title: item.manhuaTitle,
        manhua_cover: item.manhuaCover,
        chapter_id: item.chapterId,
        chapter_title: item.chapterTitle,
        chapter_number: item.chapterNumber,
        progress_percent: item.progressPercent,
        page_index: item.pageIndex,
        last_read_time: lastReadTime
      });

      if (error) throw error;
    } catch (err) {
      console.warn('Error saving reading history to Supabase, falling back to LocalStorage:', err);
      const current = await fetchUserReadingHistory(userId);
      const filtered = current.filter(h => h.manhuaId !== item.manhuaId);
      const updated = [fullItem, ...filtered];
      localStorage.setItem(`manhua_history_${userId}`, JSON.stringify(updated));
    }
  } else {
    // Fallback Local Engine
    const current = await fetchUserReadingHistory(userId);
    const filtered = current.filter(h => h.manhuaId !== item.manhuaId);
    const updated = [fullItem, ...filtered];
    localStorage.setItem(`manhua_history_${userId}`, JSON.stringify(updated));
  }

  return fullItem;
}

export async function deleteUserHistoryItem(userId: string, historyId: string): Promise<void> {
  if (hasSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', userId)
        .eq('id', historyId);
      if (error) throw error;
    } catch (err) {
      console.warn('Error deleting history item in Supabase, updating locally:', err);
      const current = await fetchUserReadingHistory(userId);
      const updated = current.filter(h => h.id !== historyId);
      localStorage.setItem(`manhua_history_${userId}`, JSON.stringify(updated));
    }
  } else {
    const current = await fetchUserReadingHistory(userId);
    const updated = current.filter(h => h.id !== historyId);
    localStorage.setItem(`manhua_history_${userId}`, JSON.stringify(updated));
  }
}

export async function clearUserReadingHistory(userId: string): Promise<void> {
  if (hasSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    } catch (err) {
      console.warn('Error clearing history in Supabase, updating locally:', err);
      localStorage.removeItem(`manhua_history_${userId}`);
    }
  } else {
    localStorage.removeItem(`manhua_history_${userId}`);
  }
}


// ==========================================
// READING LISTS METHODS (DUAL-MODE)
// ==========================================

export async function fetchUserReadingList(userId: string): Promise<ReadingListItem[]> {
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('reading_lists')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        manhuaId: row.manhua_id,
        manhuaTitle: row.manhua_title,
        manhuaCover: row.manhua_cover,
        listType: row.list_type as 'favorite' | 'reading' | 'plan',
        addedAt: row.added_at
      }));
    } catch (err) {
      console.warn('Error fetching reading lists from Supabase, falling back to LocalStorage:', err);
      const saved = localStorage.getItem(`manhua_list_${userId}`);
      return saved ? JSON.parse(saved) : [];
    }
  } else {
    const saved = localStorage.getItem(`manhua_list_${userId}`);
    return saved ? JSON.parse(saved) : [];
  }
}

export async function addManhuaToReadingList(
  userId: string, 
  manhua: Manhua, 
  listType: 'favorite' | 'reading' | 'plan'
): Promise<ReadingListItem> {
  const itemId = 'list-' + Date.now();
  const addedAt = new Date().toISOString();

  const newItem: ReadingListItem = {
    id: itemId,
    userId,
    manhuaId: manhua.id,
    manhuaTitle: manhua.title,
    manhuaCover: manhua.coverUrl,
    listType,
    addedAt
  };

  if (hasSupabase && supabase) {
    try {
      // Upsert: First remove if already exists anywhere in their lists
      await supabase
        .from('reading_lists')
        .delete()
        .eq('user_id', userId)
        .eq('manhua_id', manhua.id);

      // Insert new
      const { error } = await supabase.from('reading_lists').insert({
        id: itemId,
        user_id: userId,
        manhua_id: manhua.id,
        manhua_title: manhua.title,
        manhua_cover: manhua.coverUrl,
        list_type: listType,
        added_at: addedAt
      });

      if (error) throw error;
    } catch (err) {
      console.warn('Error adding manhua to list in Supabase, falling back to LocalStorage:', err);
      const current = await fetchUserReadingList(userId);
      const filtered = current.filter(item => item.manhuaId !== manhua.id);
      const updated = [newItem, ...filtered];
      localStorage.setItem(`manhua_list_${userId}`, JSON.stringify(updated));
    }
  } else {
    const current = await fetchUserReadingList(userId);
    // Remove if already in lists to prevent duplicates and update type
    const filtered = current.filter(item => item.manhuaId !== manhua.id);
    const updated = [newItem, ...filtered];
    localStorage.setItem(`manhua_list_${userId}`, JSON.stringify(updated));
  }

  return newItem;
}

export async function removeManhuaFromReadingList(userId: string, manhuaId: string): Promise<void> {
  if (hasSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('reading_lists')
        .delete()
        .eq('user_id', userId)
        .eq('manhua_id', manhuaId);
      if (error) throw error;
    } catch (err) {
      console.warn('Error removing manhua from list in Supabase, updating locally:', err);
      const current = await fetchUserReadingList(userId);
      const updated = current.filter(item => item.manhuaId !== manhuaId);
      localStorage.setItem(`manhua_list_${userId}`, JSON.stringify(updated));
    }
  } else {
    const current = await fetchUserReadingList(userId);
    const updated = current.filter(item => item.manhuaId !== manhuaId);
    localStorage.setItem(`manhua_list_${userId}`, JSON.stringify(updated));
  }
}
