import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const PROFILE_STORAGE_KEY = "eethal-erp-user-profile";

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  bio: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Alex Morgan",
  email: "alex@nexuserp.com",
  role: "Operations Manager",
  bio: "Leading operations across logistics and warehousing.",
};

interface UserProfileContextValue {
  profile: UserProfile;
  initials: string;
  updateProfile: (profile: UserProfile) => void;
  resetProfileDraft: () => UserProfile;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function readStoredProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;

  try {
    const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!storedProfile) return DEFAULT_PROFILE;

    return {
      ...DEFAULT_PROFILE,
      ...JSON.parse(storedProfile),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "U";
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => readStoredProfile());

  const value = useMemo<UserProfileContextValue>(
    () => ({
      profile,
      initials: getInitials(profile.name),
      updateProfile: (nextProfile) => {
        setProfile(nextProfile);
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      },
      resetProfileDraft: () => profile,
    }),
    [profile],
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within UserProfileProvider.");
  }

  return context;
}
