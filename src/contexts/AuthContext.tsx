"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/types/order";

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount - NO REDIRECTS
  useEffect(() => {
    console.log("🔄 AuthProvider mounted, checking auth...");
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("🔍 Checking authentication...");
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      console.log("📡 Auth check response:", response.status);

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        console.log("✅ User authenticated:", data);
      } else {
        setUser(null);
        setToken(null);
        console.log("❌ No valid session");
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
      console.log("✅ Auth check complete");
    }
  };

  const login = async (email: string, password: string) => {
    console.log("🔐 Attempting login for:", email);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      console.log("📡 Login response:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Login failed:", error);
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      console.log("✅ Login successful:", data);

      setUser(data.user);
      setToken(data.token);

      // Navigate to dashboard - middleware will handle redirect if needed
      console.log("🔄 Navigating to dashboard...");
      router.push("/dashboard");
      router.refresh(); // Force a refresh to trigger middleware
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("🚪 Logging out...");
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      setToken(null);
      console.log("✅ ============Logged out successfully");

      // Navigate to login - middleware will handle if already there
      router.push("/login");
      router.refresh(); // Force a refresh to clear any cached state
    } catch (error) {
      console.error("❌ Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    console.log("🔄 Refreshing user...");
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
