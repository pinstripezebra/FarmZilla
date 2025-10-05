import React, { createContext, useState, useContext } from "react";

export interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  // add other fields as needed
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Optionally, initialize from localStorage if you want persistence
  const [user, setUserState] = useState<UserData | null>(null);

  const setUser = (newUser: UserData | null) => {
    setUserState(newUser);
    // Optionally, persist to localStorage here if desired
  };

  const isAuthenticated = !!user;

  return (
    <UserContext.Provider value={{ user, setUser, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};