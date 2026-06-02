import { createTheme, ThemeOptions } from '@mui/material/styles';

// Color palette from the design system
const colors = {
  primary: {
    main: '#1BA784', // Better Life Green
    dark: '#14806A',
    light: '#D4F0E8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#2196F3', // Medical Blue
    dark: '#1565C0',
    light: '#BBDEFB',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#38A169',
    dark: '#2F855A',
    light: '#C6F6D5',
  },
  warning: {
    main: '#DD6B20',
    dark: '#C05621',
    light: '#FEEBC8',
  },
  error: {
    main: '#E53E3E',
    dark: '#C53030',
    light: '#FEB2B2',
  },
  info: {
    main: '#3182CE',
    dark: '#2B6CB0',
    light: '#BEE3F8',
  },
  background: {
    default: '#FFFFFF',
    paper: '#F5F7FA',
  },
  text: {
    primary: '#2D3748',
    secondary: '#718096',
  },
  divider: '#E2E8F0',
};

const themeOptions: ThemeOptions = {
  palette: colors,
  typography: {
    fontFamily: 'Roboto, "Inter", sans-serif',
    h1: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(27,167,132,0.06)',
    ...Array(23).fill(''), // Fill remaining shadows to match MUI's expected array length
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(27,167,132,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: colors.primary.dark,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.divider}`,
        },
        head: {
          fontWeight: 600,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:nth-of-type(even)': {
            backgroundColor: colors.background.paper,
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(27, 167, 132, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1440,
    },
  },
};

const theme = createTheme(themeOptions);

export default theme;