// Mock auth to run completely locally in browser without Firebase
export const auth = {
  currentUser: {
    uid: 'local-user',
    email: 'local@user.com',
    displayName: 'قارئ مخلص',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  }
};

export const signInWithGoogle = async () => {
  return { user: auth.currentUser };
};

export const loginWithEmail = async (email: string, password: string) => {
  return { user: auth.currentUser };
};

export const signupWithEmail = async (email: string, password: string) => {
  return { user: auth.currentUser };
};

export const resetPassword = async (email: string) => {
  return true;
};

export const logout = async () => {
  return true;
};

// Immediately triggers callback with a default local user to bypass loading/login screens
export const subscribeToAuthChanges = (callback: (user: any) => void) => {
  // Return the default local user
  const localUser = {
    uid: 'local-user',
    email: 'local@user.com',
    displayName: 'قارئ مخلص',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  };
  callback(localUser);
  return () => {};
};
