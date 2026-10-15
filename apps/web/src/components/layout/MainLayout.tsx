import React, { useState, useMemo } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  InputBase,
  Fade,
  Paper,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Person,
  CalendarToday,
  MedicalServices,
  Theaters,
  Storefront,
  Receipt,
  Inventory,
  Science,
  BarChart,
  People,
  Settings,
  Logout,
  Search,
  Home,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";
import { alpha } from "@mui/material/styles";
import { Badge } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

interface MenuItemType {
  text: string;
  icon: React.ReactNode;
  path: string;
  allowedRoles: string[];
}

// Healthcare color palette as requested
const PRIMARY_COLOR = "#0EA5A4";
const BG_COLOR = "#F8FAFC";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#64748B";

const MainLayout = React.memo(({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { toggleTheme, mode } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg")); // Only use temporary drawer on screens smaller than lg (1200px)

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false); // Default to expanded sidebar
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const roleName = user?.role?.name ?? "";
  const canViewAppointments = ["ADMINISTRATOR", "DOCTOR", "NURSE"].includes(roleName);
  const canViewTheater = ["ADMINISTRATOR", "DOCTOR", "NURSE", "ANESTHETIST", "RECEPTIONIST", "RECEPTION_CASHIER"].includes(roleName);
  const canViewInventory = ["ADMINISTRATOR", "PHARMACIST"].includes(roleName);

  const {
    data: attentionCounts = {},
    isError: attentionCountsError,
  } = useQuery<Record<string, number>>({
    queryKey: ["sidebar-attention-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [workflowResponse, unpaidInvoicesResponse, partialInvoicesResponse] = await Promise.all([
        api.get("/visits/dashboard/stats"),
        api.get("/finance/invoices", { params: { status: "UNPAID", limit: 1 } }),
        api.get("/finance/invoices", { params: { status: "PARTIAL", limit: 1 } }),
      ]);
      const workflowStats = workflowResponse.data.stats;
      const counts: Record<string, number> = {
        "/patients/admissions": workflowStats.currentAdmissions,
        "/consultations": workflowStats.waitingForConsultation,
        "/lab-tests": workflowStats.pendingLabTests,
        "/prescriptions": workflowStats.pendingPrescriptions,
        "/finance/invoices":
          Number(unpaidInvoicesResponse.data.total ?? 0) +
          Number(partialInvoicesResponse.data.total ?? 0),
      };

      if (canViewAppointments) {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const response = await api.get("/appointments", {
          params: {
            fromDate: start.toISOString(),
            toDate: end.toISOString(),
            limit: 1,
          },
        });
        counts["/appointments"] = Number(response.data.total ?? 0);
      }

      if (canViewTheater) {
        const response = await api.get("/theater");
        const procedures = response.data;
        if (!Array.isArray(procedures)) {
          throw new Error("Theater attention count response was invalid");
        }
        counts["/theater"] = procedures.filter(
          (procedure: { status: string }) => procedure.status === "REQUESTED",
        ).length;
      }

      if (canViewInventory) {
        const response = await api.get("/pharmacy/low-stock");
        const lowStockItems = response.data.data;
        if (!Array.isArray(lowStockItems)) {
          throw new Error("Pharmacy attention count response was invalid");
        }
        counts["/pharmacy/inventory"] = lowStockItems.length;
      }

      return counts;
    },
    refetchInterval: 60_000,
  });

  const allMenuItems: MenuItemType[] = [
    {
      text: "Dashboard",
      icon: <Home />,
      path: "/dashboard",
      allowedRoles: ["admin"], // Only admin sees the main dashboard
    },
    // Role-specific dashboards - each user only sees their own
    {
      text: "Reception Dashboard",
      icon: <People />,
      path: "/reception",
      allowedRoles: ["reception"],
    },
    {
      text: "Doctor Dashboard",
      icon: <MedicalServices />,
      path: "/doctor",
      allowedRoles: ["doctor"],
    },
    {
      text: "Nurse Dashboard",
      icon: <People />,
      path: "/nurse",
      allowedRoles: ["nurse"],
    },
    {
      text: "Pharmacy Dashboard",
      icon: <MedicalServices />,
      path: "/pharmacy",
      allowedRoles: ["pharmacist"],
    },
    {
      text: "Medicine Shop",
      icon: <Storefront />,
      path: "/pharmacy/shop",
      allowedRoles: ["pharmacist", "admin"],
    },
    {
      text: "Laboratory Dashboard",
      icon: <Science />,
      path: "/lab",
      allowedRoles: ["lab_technician"],
    },
    {
      text: "Maternity Dashboard",
      icon: <People />,
      path: "/maternity",
      allowedRoles: ["admin", "doctor", "nurse"],
    },
    {
      text: "Theater",
      icon: <Theaters />,
      path: "/theater",
      allowedRoles: ["admin", "doctor", "nurse", "anesthetist", "reception"],
    },
    {
      text: "Accounts Dashboard",
      icon: <Receipt />,
      path: "/accounts",
      allowedRoles: ["accountant"],
    },
    {
      text: "Patients",
      icon: <Person />,
      path: "/patients",
      allowedRoles: ["admin", "doctor", "nurse"],
    },
    {
      text: "Patient Admissions",
      icon: <Person />,
      path: "/patients/admissions",
      allowedRoles: ["admin", "reception", "doctor", "nurse"],
    },
    {
      text: "Appointments",
      icon: <CalendarToday />,
      path: "/appointments",
      allowedRoles: ["admin", "doctor"],
    },
    {
      text: "Consultations",
      icon: <MedicalServices />,
      path: "/consultations",
      allowedRoles: ["admin", "doctor"],
    },
    {
      text: "Prescriptions",
      icon: <Receipt />,
      path: "/prescriptions",
      allowedRoles: ["admin", "pharmacist", "doctor"],
    },
    {
      text: "Pharmacy Inventory",
      icon: <Inventory />,
      path: "/pharmacy/inventory",
      allowedRoles: ["admin", "pharmacist"],
    },
    {
      text: "Lab Tests",
      icon: <Science />,
      path: "/lab-tests",
      allowedRoles: ["admin", "lab_technician"],
    },
    {
      text: "Staff Management",
      icon: <People />,
      path: "/staff-management",
      allowedRoles: ["admin", "ADMINISTRATOR"],
    },
    {
      text: "Duty Roster",
      icon: <CalendarToday />,
      path: "/duty-roster",
      allowedRoles: ["admin", "ADMINISTRATOR"],
    },
    {
      text: "Wards & Beds",
      icon: <MedicalServices />,
      path: "/wards",
      allowedRoles: ["admin", "ADMINISTRATOR"],
    },
    {
      text: "Finance Dashboard",
      icon: <BarChart />,
      path: "/finance",
      allowedRoles: ["admin", "accountant", "cashier"],
    },
    {
      text: "Invoices",
      icon: <Receipt />,
      path: "/finance/invoices",
      allowedRoles: ["admin", "accountant", "cashier", "reception"],
    },
    {
      text: "Settings",
      icon: <Settings />,
      path: "/settings",
      allowedRoles: ["*"], // All users can access their personal settings
    },
    {
      text: "Logout",
      icon: <Logout />,
      path: "/logout",
      allowedRoles: ["*"],
    },
  ];

  const userRole = (() => {
    let roleName = "";
    if (user?.role && typeof user.role === "object" && user.role.name) {
      roleName = user.role.name;
    } else if (user?.role && typeof user.role === "string") {
      roleName = user.role;
    }

    // Map database role names to sidebar expected role names
    const roleMapping: Record<string, string> = {
      ADMINISTRATOR: "admin",
      RECEPTIONIST: "reception",
      RECEPTION_CASHIER: "reception",
      NURSE: "nurse",
      DOCTOR: "doctor",
      LAB_TECH: "lab_technician",
      PHARMACIST: "pharmacist",
      ANESTHETIST: "anesthetist",
      CASHIER: "accountant",
    };

    return roleMapping[roleName] || roleName.toLowerCase();
  })();

  const menuItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      if (item.allowedRoles.includes("*")) return true;
      return item.allowedRoles.includes(userRole || "");
    });
  }, [userRole]);

  const findActiveMenuItem = () => {
    const currentPath = location.pathname.replace(/\/+$/, "") || "/";
    return menuItems
      .filter((item) =>
        currentPath === item.path ||
        (item.path !== "/dashboard" && currentPath.startsWith(item.path + "/")),
      )
      .sort((first, second) => {
        const exactMatchPriority =
          Number(currentPath === second.path) - Number(currentPath === first.path);
        return exactMatchPriority || second.path.length - first.path.length;
      })[0];
  };

  const getCurrentPageTitle = () => findActiveMenuItem()?.text || "Dashboard";

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Prefetch function to load page chunks before navigation
  const prefetchPage = (path: string) => {
    // Map paths to their import functions for prefetching
    const pageImports: Record<string, () => Promise<unknown>> = {
      "/reception": () =>
        import("../../pages/reception/ReceptionDashboardPage"),
      "/doctor": () => import("../../pages/doctor/DoctorDashboardPage"),
      "/nurse": () => import("../../pages/nurse/NurseDashboardPage"),
      "/pharmacy": () => import("../../pages/pharmacy/PharmacyDashboardPage"),
      "/pharmacy/shop": () => import("../../pages/pharmacy/PharmacyShopPage"),
      "/lab": () => import("../../pages/lab/LabDashboardPage"),
      "/maternity": () =>
        import("../../pages/maternity/MaternityDashboardPage"),
      "/theater": () => import("../../pages/theater/TheaterDashboardPage"),
      "/accounts": () => import("../../pages/accounts/AccountsDashboardPage"),
      "/patients": () => import("../../pages/patients/PatientListPage"),
      "/appointments": () =>
        import("../../pages/appointments/AppointmentsPage"),
      "/consultations": () =>
        import("../../pages/consultations/ConsultationsPage"),
      "/prescriptions": () =>
        import("../../pages/prescriptions/PrescriptionsPage"),
      "/lab-tests": () => import("../../pages/lab/LabTestsPage"),
      "/finance": () => import("../../pages/finance/FinanceDashboardPage"),
      "/settings": () => import("../../pages/settings/SettingsPage"),
    };

    // Only prefetch if the import function exists
    if (pageImports[path]) {
      // Start prefetching the chunk
      pageImports[path]();
    }
  };

  const handleNavigation = (path: string) => {
    if (path === "/logout") {
      handleLogout();
      return;
    }
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout(navigate);
    setUserMenuAnchor(null);
  };

  const activeMenuItemPath = findActiveMenuItem()?.path;

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "white",
        boxShadow: "0 0 20px rgba(0,0,0,0.05)",
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          px: desktopCollapsed && !isMobile ? 1 : 2,
          minHeight: "64px !important",
        }}
      >
        {!(desktopCollapsed && !isMobile) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: PRIMARY_COLOR,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "white", fontWeight: "bold" }}
              >
                B
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: TEXT_PRIMARY,
                fontSize: "1.25rem",
              }}
            >
              BetterLife
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            size="small"
            sx={{
              bgcolor: alpha(PRIMARY_COLOR, 0.1),
              "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.2) },
              width: 32,
              height: 32,
            }}
            aria-label="Toggle sidebar"
          >
            <MenuIcon sx={{ color: PRIMARY_COLOR, fontSize: 18 }} />
          </IconButton>
        )}
      </Toolbar>
      <Divider sx={{ mx: 2 }} />
      <List
        sx={{
          px: desktopCollapsed && !isMobile ? 1 : 2,
          py: 2,
          flexGrow: 1,
        }}
      >
        {menuItems.map((item) => {
          const isActive = item.path === activeMenuItemPath;
          return (
            <ListItem
              key={item.text}
              component="button"
              onClick={() => handleNavigation(item.path)}
              onMouseEnter={() => prefetchPage(item.path)}
              onFocus={() => prefetchPage(item.path)}
              sx={{
                width: "100%",
                borderRadius: "10px",
                mb: 0.5,
                minHeight: 48,
                justifyContent: "flex-start",
                px: desktopCollapsed && !isMobile ? 1 : 1.5,
                color: isActive ? "white" : TEXT_MUTED,
                bgcolor: isActive ? PRIMARY_COLOR : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: isActive ? PRIMARY_COLOR : alpha(PRIMARY_COLOR, 0.1),
                  color: isActive ? "white" : PRIMARY_COLOR,
                },
                "&:focus-visible": {
                  outline: `2px solid ${PRIMARY_COLOR}`,
                  outlineOffset: "2px",
                },
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <ListItemIcon
                sx={{
                  minWidth: desktopCollapsed && !isMobile ? 0 : 40,
                  mr: desktopCollapsed && !isMobile ? 0 : 1,
                  color: "inherit",
                }}
              >
                {desktopCollapsed && !isMobile && attentionCounts[item.path] > 0 ? (
                  <Badge badgeContent={attentionCounts[item.path]} color="error" max={99}>
                    {item.icon}
                  </Badge>
                ) : item.icon}
              </ListItemIcon>
              {!(desktopCollapsed && !isMobile) && (
                <ListItemText
                    primary={
                      attentionCounts[item.path] > 0 ? (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                          <span>{item.text}</span>
                          <Badge
                            badgeContent={attentionCounts[item.path]}
                            color="error"
                            max={99}
                            sx={{ "& .MuiBadge-badge": { position: "static", transform: "none", fontWeight: 700 } }}
                          />
                        </Box>
                      ) : item.text
                    }
                  sx={{
                    margin: 0,
                    "& .MuiListItemText-primary": {
                      fontSize: "0.9rem",
                      fontWeight: isActive ? 600 : 500,
                    },
                  }}
                />
              )}
            </ListItem>
          );
        })}
      </List>
      {attentionCountsError && (
        <Typography role="alert" variant="caption" color="error" sx={{ px: 2, pb: 1 }}>
          Attention counts could not be loaded.
        </Typography>
      )}
      {!(desktopCollapsed && !isMobile) && (
        <Box
          sx={{
            p: 2,
            bgcolor: alpha(PRIMARY_COLOR, 0.05),
            m: 2,
            borderRadius: "12px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: PRIMARY_COLOR,
                fontSize: "1rem",
              }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: TEXT_PRIMARY, fontWeight: 600 }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                {userRole}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: BG_COLOR,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          bgcolor: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          zIndex: theme.zIndex.drawer + 1,
          // Only apply width/margin on desktop
          width: {
            xs: "100%",
            lg: `calc(100% - ${desktopCollapsed ? 80 : 260}px)`,
          },
          marginLeft: {
            xs: "0px",
            lg: desktopCollapsed ? "80px" : "260px",
          },
        }}
      >
        <Toolbar sx={{ minHeight: "64px !important" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              // Only show hamburger on mobile (less than lg)
              display: { lg: "none" },
              bgcolor: alpha(PRIMARY_COLOR, 0.1),
              "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.2) },
            }}
          >
            <MenuIcon sx={{ color: PRIMARY_COLOR }} />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              color: TEXT_PRIMARY,
              fontWeight: 600,
              display: { xs: "none", sm: "block" },
            }}
          >
            {getCurrentPageTitle()}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton sx={{ mr: 1 }} onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {/* Patient Search Bar */}
          <Paper
            component="form"
            sx={{
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
              width: { xs: 120, sm: 250, md: 300 },
              mr: 2,
              borderRadius: "10px",
              bgcolor: BG_COLOR,
              boxShadow: "none",
              border: "1px solid #e2e8f0",
            }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1, fontSize: "0.875rem" }}
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputProps={{ "aria-label": "search patients" }}
            />
            <IconButton type="submit" sx={{ p: "8px" }} aria-label="search">
              <Search sx={{ fontSize: 20, color: TEXT_MUTED }} />
            </IconButton>
          </Paper>

          {/* Profile Menu */}
          <IconButton
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{ p: 0.5 }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: PRIMARY_COLOR,
                fontSize: "1rem",
              }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            TransitionComponent={Fade}
            sx={{
              mt: 1.5,
              "& .MuiPaper-root": {
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                minWidth: 180,
                overflow: "visible",
                "&:before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "white",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            }}
          >
                        <MenuItem
              onClick={() => {
                navigate("/profile");
                setUserMenuAnchor(null);
              }}
              sx={{ borderRadius: "8px", m: 0.5 }}
            >
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                navigate("/settings");
                setUserMenuAnchor(null);
              }}
              sx={{ borderRadius: "8px", m: 0.5 }}
            >
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={handleLogout}
              sx={{ borderRadius: "8px", m: 0.5, color: "#ef4444" }}
            >
              <ListItemIcon sx={{ color: "#ef4444" }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.5)",
            zIndex: theme.zIndex.drawer - 1,
            backdropFilter: "blur(2px)",
          }}
          onClick={handleDrawerToggle}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar - Temporary drawer for mobile/tablet screens */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: false, // Prevents the sidebar from bleeding through on desktop
          }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: 260,
              borderRight: "none",
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Desktop Sidebar - Permanent drawer for large screens */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", lg: "block" },
            flexShrink: 0,
            width: desktopCollapsed ? 80 : 260,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: desktopCollapsed ? 80 : 260,
              overflowX: "hidden", // Prevents content overflow during collapse
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              borderRight: "none",
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content Area - flex:1 makes it fill remaining space automatically */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0, // Critical: allows content to shrink properly
          minHeight: "100vh",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "auto",
          p: { xs: 2, lg: 3, xl: 4 },
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Box
          sx={{
            width: "100%",
            boxSizing: "border-box",
            maxWidth: "100%",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
});

MainLayout.displayName = "MainLayout";

export default MainLayout;