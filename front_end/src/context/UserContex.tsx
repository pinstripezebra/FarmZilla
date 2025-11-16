import React, { createContext, useState, useContext, useEffect } from "react";
import { userService } from "../services/userService";

export interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  location?: string;
  phone_number?: string;
  description?: string;
  // add other fields as needed
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full user data on initialization
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const username = localStorage.getItem("username");
        const userRole = localStorage.getItem("userRole");
        
        if (userId && username && userRole) {
          try {
            // Try to fetch full user data from server
            const fullUserData = await userService.getUserById(userId);
            setUserState(fullUserData);
          } catch (error) {
            console.error("Error fetching full user data:", error);
            // Fallback to localStorage data
            setUserState({
              id: userId,
              username: username,
              email: "", 
              role: userRole
            });
          }
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

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
    <UserContext.Provider value={{ user, setUser, isAuthenticated, isLoading }}>
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