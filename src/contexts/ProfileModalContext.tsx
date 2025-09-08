import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ProfileModalContextType {
  open: boolean;
  openProfile: () => void;
  closeProfile: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextType | undefined>(undefined);

export const useProfileModal = () => {
  const ctx = useContext(ProfileModalContext);
  if (!ctx) throw new Error('useProfileModal must be used within ProfileModalProvider');
  return ctx;
};

export const ProfileModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const openProfile = useCallback(() => setOpen(true), []);
  const closeProfile = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, openProfile, closeProfile }), [open, openProfile, closeProfile]);

  return (
    <ProfileModalContext.Provider value={value}>
      {children}
    </ProfileModalContext.Provider>
  );
};

