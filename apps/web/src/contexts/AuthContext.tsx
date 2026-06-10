import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

// Types
interface User {
  id: string;
  staffId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    permissions: {
      id: string;
      action: string;
      resource: string;
    }[];
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL - uses current origin in production, localhost in development
const API_BASE_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:4000/api/v1";

// DEBUG LOGGING - helps diagnose login issues
console.group("🔐 Auth Debug Info");
console.log("API_BASE_URL:", API_BASE_URL);
console.log("VITE_API_URL env var:", (import.meta as any).env.VITE_API_URL);
console.log("Current window location:", window.location.href);
console.groupEnd();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken) {
        try {
          // Verify token by fetching current user
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUser(response.data.data);
          setAccessToken(storedToken);
        } catch (error) {
          // Token is invalid, attempt to refresh
          try {
            const newToken = await refreshToken();
            if (newToken) {
              const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setUser(response.data.data);
              setAccessToken(newToken);
            }
          } catch (refreshError) {
            console.error("Failed to refresh token:", refreshError);
            localStorage.removeItem("accessToken");
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
        },
      );
      const { accessToken: newToken } = response.data.data;
      localStorage.setItem("accessToken", newToken);
      setAccessToken(newToken);
      return newToken;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return null;
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    const fullLoginUrl = `${API_BASE_URL}/auth/login`;
    console.group("🔐 Login Attempt Debug");
    console.log("Login URL being called:", fullLoginUrl);
    console.log("Request payload:", { email, password: "***REDACTED***" });

    try {
      const response = await axios.post(
        fullLoginUrl,
        { email, password },
        {
          withCredentials: true,
        },
      );
      console.log("✅ Login SUCCESS! Response:", response.data);
      const { accessToken: newToken, user: userData } = response.data.data;
      localStorage.setItem("accessToken", newToken);
      setAccessToken(newToken);
      setUser(userData);
      console.groupEnd();
    } catch (error: any) {
      console.error("❌ Login FAILED! Full error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      console.error("Request was sent to:", fullLoginUrl);
      console.groupEnd();

      const errorMessage =
        error.response?.data?.error?.message || "Login failed";
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        },
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshToken,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
