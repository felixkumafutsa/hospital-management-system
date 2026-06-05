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
  Badge,
  Fade,
  Paper,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Person,
  CalendarToday,
  MedicalServices,
  Description,
  Receipt,
  Inventory,
  Science,
  BarChart,
  People,
  Settings,
  Logout,
  Search,
  Notifications,
  Mail,
  Home,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { alpha } from "@mui/material/styles";

interface MenuItemType {
  text: string;
  icon: React.ReactNode;
  path: string;
  allowedRoles: string[];
}

// Healthcare color palette as requested
const PRIMARY_COLOR = "#0EA5A4";
const SECONDARY_COLOR = "#14B8A6";
const BG_COLOR = "#F8FAFC";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#64748B";

const MainLayout = React.memo(({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(isTablet);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const drawerWidth = desktopCollapsed ? 80 : 260;
  const actualDrawerWidth = isMobile ? 260 : drawerWidth;

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
      text: "Laboratory Dashboard",
      icon: <Science />,
      path: "/lab",
      allowedRoles: ["lab_technician"],
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
      allowedRoles: ["admin", "reception", "doctor", "nurse"],
    },
    {
      text: "Appointments",
      icon: <CalendarToday />,
      path: "/appointments",
      allowedRoles: ["admin", "reception", "doctor"],
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
      allowedRoles: ["admin"],
    },
    {
      text: "User Management",
      icon: <People />,
      path: "/users",
      allowedRoles: ["admin"],
    },
    {
      text: "Finance",
      icon: <BarChart />,
      path: "/finance",
      allowedRoles: ["admin", "accountant"],
    },
    {
      text: "Settings",
      icon: <Settings />,
      path: "/settings",
      allowedRoles: ["admin"],
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
      NURSE: "nurse",
      DOCTOR: "doctor",
      LAB_TECH: "lab_technician",
      PHARMACIST: "pharmacist",
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

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find((item) =>
      location.pathname.startsWith(item.path),
    );
    return currentItem?.text || "Dashboard";
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
    logout();
    navigate("/login");
    setUserMenuAnchor(null);
  };

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
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" &&
              location.pathname.startsWith(item.path));
          return (
            <ListItem
              key={item.text}
              component="button"
              onClick={() => handleNavigation(item.path)}
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
                {item.icon}
              </ListItemIcon>
              {!(desktopCollapsed && !isMobile) && (
                <ListItemText
                  primary={item.text}
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
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${actualDrawerWidth}px)` },
          ml: { md: `${actualDrawerWidth}px` },
          bgcolor: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          zIndex: theme.zIndex.drawer + 1,
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
              display: { md: "none" },
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

          {/* Notifications */}
          <IconButton
            size="large"
            aria-label="show 4 new notifications"
            color="inherit"
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={4} color="error">
              <Notifications sx={{ color: TEXT_MUTED }} />
            </Badge>
          </IconButton>

          {/* Messages */}
          <IconButton
            size="large"
            aria-label="show 3 new messages"
            color="inherit"
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="primary">
              <Mail sx={{ color: TEXT_MUTED }} />
            </Badge>
          </IconButton>

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
              My Account
            </MenuItem>
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

      <Box
        component="nav"
        sx={{
          width: { md: actualDrawerWidth },
          flexShrink: { md: 0 },
          boxSizing: "border-box",
        }}
        aria-label="main navigation"
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: isMobile ? 260 : actualDrawerWidth,
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
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${actualDrawerWidth}px)` },
          minHeight: "100vh",
          maxWidth: "100%",
          boxSizing: "border-box",
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: "auto",
          p: { xs: 2, md: 3, lg: 4 },
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
