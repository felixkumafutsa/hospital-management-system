import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { NavigateFunction } from "react-router-dom";
import { getDashboardRoute } from "../utils/dashboardRoutes";

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
  login: (
    email: string,
    password: string,
    navigate: NavigateFunction,
  ) => Promise<User>;
  logout: (navigate: NavigateFunction) => Promise<void>;
  refreshToken: () => Promise<string | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use the same-origin Nginx proxy in production and the local API during Vite development.
const API_BASE_URL = (() => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl) return envUrl;

  if (import.meta.env.PROD && window.location.hostname === "betterlife-web.vercel.app") {
    return "https://betterlife-api.vercel.app/api/v1";
  }

  if (import.meta.env.PROD) return "/api/v1";

  return "http://localhost:4000/api/v1";
})();

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
  const login = useCallback(
    async (
      email: string,
      password: string,
      navigate: NavigateFunction,
    ): Promise<User> => {
      try {
        // Ensure no double slashes in URL
        const cleanBaseUrl = API_BASE_URL.endsWith("/")
          ? API_BASE_URL.slice(0, -1)
          : API_BASE_URL;
        const fullLoginUrl = `${cleanBaseUrl}/auth/login`;

        const response = await axios.post(
          fullLoginUrl,
          { email, password },
          {
            withCredentials: true,
          },
        );
        const { accessToken: newToken, user: userData } = response.data.data;
        localStorage.setItem("accessToken", newToken);
        setAccessToken(newToken);
        setUser(userData);
        setLoading(false); // Stop loading

        // Redirect to the correct dashboard
        const dashboardRoute = getDashboardRoute(userData.role.name);
        navigate(dashboardRoute, { replace: true });

        return userData;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error?.message || "Login failed";
        throw new Error(errorMessage);
      }
    },
    [],
  );

  // Logout function
  const logout = useCallback(async (navigate: NavigateFunction) => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        },
      );
    } catch {
      console.error("Logout request failed");
    } finally {
      localStorage.removeItem("accessToken");
      setAccessToken(null);
      setUser(null);
      setLoading(false); // Stop loading
      navigate("/login", { replace: true });
    }
  }, [accessToken]);

  const memoizedValue = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshToken,
      isAuthenticated: !!user,
    }),
    [user, loading, login, logout, refreshToken],
  );

  return (
    <AuthContext.Provider value={memoizedValue}>
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
