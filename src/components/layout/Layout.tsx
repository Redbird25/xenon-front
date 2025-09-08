import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Menu as MenuIcon,
  Dashboard,
  Book,
  School,
  Logout,
  AccountCircle,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileModal } from '../../contexts/ProfileModalContext';

const drawerWidth = 240;
const miniWidth = 72;

interface LayoutProps { onToggleMode?: () => void; mode?: 'light' | 'dark' }
const Layout: React.FC<LayoutProps> = ({ onToggleMode, mode = 'dark' }) => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { openProfile } = useProfileModal();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['student', 'teacher', 'admin', 'self-learner', 'tenant-manager']
    },
    {
      text: 'My Courses',
      icon: <Book />,
      path: '/courses',
      roles: ['student', 'teacher', 'admin', 'self-learner']
    },
    {
      text: 'Create Course',
      icon: <School />,
      path: '/teacher/courses/create',
      roles: ['teacher', 'admin', 'self-learner']
    },
    // Tenant manager
    {
      text: 'Manage People',
      icon: <Dashboard />, // could be People icon
      path: '/manager/users',
      roles: ['tenant-manager']
    },
    // Admin
    {
      text: 'Tenants',
      icon: <Dashboard />, // replace with Apartment icon later
      path: '/admin/tenants',
      roles: ['admin']
    },
    {
      text: 'Self-Learners',
      icon: <Dashboard />, // replace with Person icon later
      path: '/admin/self-learners',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const expanded = sidebarOpen || isMobile; // On mobile always show labels
  const drawer = (
    <div>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            background: 'linear-gradient(90deg, #7C3AED 0%, #00E5FF 100%)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontWeight: 800,
          }}
        >
          {expanded ? 'Xenon AI' : 'X'}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <Tooltip title={!expanded ? item.text : ''} placement="right">
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  minHeight: 48,
                  justifyContent: expanded ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 2 : 'auto', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {expanded && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${(sidebarOpen ? drawerWidth : miniWidth)}px)` },
          ml: { sm: `${sidebarOpen ? drawerWidth : miniWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 600) {
                setMobileOpen(true);
              } else {
                toggleSidebar();
              }
            }}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Learning Platform
          </Typography>
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={onToggleMode} sx={{ mr: 1 }}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        id="primary-search-account-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); openProfile(); }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        aria-label="navigation"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: { sm: `${(sidebarOpen ? drawerWidth : miniWidth)}px` },
          flexShrink: { sm: 0 },
        }}
      >
        {/* Permanent (desktop) */}
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarOpen ? drawerWidth : miniWidth,
              overflowX: 'hidden',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: 'width .2s ease',
            },
          }}
          open={sidebarOpen}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Temporary (mobile) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{
        flexGrow: 1,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, md: 3 },
        width: { sm: `calc(100% - ${(sidebarOpen ? drawerWidth : miniWidth)}px)` },
        minHeight: '100vh',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'radial-gradient(1200px 600px at 10% -20%, rgba(124,58,237,.25), transparent), radial-gradient(1000px 500px at 110% 10%, rgba(0,229,255,.15), transparent)'
          : 'radial-gradient(1200px 600px at 10% -20%, rgba(124,58,237,.10), transparent), radial-gradient(1000px 500px at 110% 10%, rgba(0,229,255,.10), transparent)',
        maxWidth: 1440,
        mx: 'auto',
      }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
