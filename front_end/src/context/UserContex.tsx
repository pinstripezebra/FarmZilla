import React, { createContext, useState, useContext } from "react";

interface UserContextType {
  username: string;
  setUsername: (username: string) => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize username from localStorage if available
  const [username, setUsernameState] = useState(() => localStorage.getItem("username") || "");

  // When username changes, update localStorage
  const setUsername = (newUsername: string) => {
    setUsernameState(newUsername);
    if (newUsername) {
      localStorage.setItem("username", newUsername);
    } else {
      localStorage.removeItem("username");
    }
  };

  const isAuthenticated = !!username;

  return (
    <UserContext.Provider value={{ username, setUsername, isAuthenticated }}>
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