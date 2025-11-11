import React, { createContext, useState, useContext } from "react";

export interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  phone_number?: string;
  // add other fields as needed
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage if available
  const initializeUser = (): UserData | null => {
    try {
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");
      const userRole = localStorage.getItem("userRole");
      
      if (userId && username && userRole) {
        return {
          id: userId,
          username: username,
          email: "", // We'll need to fetch this if needed
          role: userRole
        };
      }
    } catch (error) {
      console.error("Error initializing user from localStorage:", error);
    }
    return null;
  };

  const [user, setUserState] = useState<UserData | null>(initializeUser);

  const setUser = (newUser: UserData | null) => {
    setUserState(newUser);
    // Persist to localStorage
    if (newUser) {
      localStorage.setItem("userId", newUser.id);
      localStorage.setItem("username", newUser.username);
      localStorage.setItem("userRole", newUser.role);
      if (newUser.email) {
        localStorage.setItem("userEmail", newUser.email);
      }
    } else {
      // Clear localStorage on logout
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
    }
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