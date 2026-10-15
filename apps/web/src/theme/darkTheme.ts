import { createTheme, ThemeOptions } from '@mui/material/styles';

const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#1BA784',
      dark: '#14806A',
      light: '#D4F0E8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2196F3',
      dark: '#1565C0',
      light: '#BBDEFB',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#20343A',
      paper: '#1E7F8C',
    },
    text: {
      primary: '#EAF7FB',
      secondary: '#BFEAF2',
    },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        root: {
          '& .MuiDialog-container': {
            justifyContent: 'flex-end',
            alignItems: 'stretch',
          },
          '& .MuiDialog-paper': {
            width: 'min(560px, 100%)',
            maxWidth: '100%',
            height: '100%',
            maxHeight: '100%',
            margin: 0,
            borderRadius: 0,
            borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
          },
        },
      },
    },
  },
};

const darkTheme = createTheme(darkThemeOptions);

export default darkTheme;