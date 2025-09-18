import { alpha, createTheme, ThemeOptions, responsiveFontSizes } from '@mui/material/styles';

const neonPrimary = '#7C3AED';
const neonCyan = '#00E5FF';
const slate900 = '#0b1020';
const slate800 = '#11162a';
const slate100 = '#E6EAF7';

const common: ThemeOptions = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: -0.5 },
    h2: { fontWeight: 800, letterSpacing: -0.5 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.001ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': { color: 'inherit' },
          '&.MuiFormLabel-filled': { color: 'inherit' },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'transform .2s ease, box-shadow .2s ease',
          outlineOffset: 2,
          willChange: 'transform',
          '&:hover': { transform: 'translateY(-1px)' },
          '&.Mui-focusVisible': { outline: `2px solid ${neonCyan}` },
        },
        containedPrimary: {
          boxShadow: '0 8px 24px rgba(124,58,237,.35)'
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 8,
          '&:hover': { background: alpha(neonPrimary, 0.12) },
          '&.Mui-focusVisible': { outline: `2px solid ${neonCyan}`, outlineOffset: 2 },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& input:-webkit-autofill': {
            WebkitTextFillColor: 'inherit',
            caretColor: 'inherit',
            transition: 'background-color 99999s ease-in-out 0s',
            WebkitBoxShadow: '0 0 0px 1000px transparent inset',
          },
          '&:-webkit-autofill': {
            WebkitTextFillColor: 'inherit',
            caretColor: 'inherit',
            transition: 'background-color 99999s ease-in-out 0s',
            WebkitBoxShadow: '0 0 0px 1000px transparent inset',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { transition: 'transform .2s ease', '&:hover': { transform: 'translateY(-2px)' } },
      },
    },
    
  },
};

export const createXenonTheme = (mode: 'light' | 'dark') =>
  responsiveFontSizes(createTheme({
    ...common,
    palette: {
      mode,
      primary: { main: neonPrimary },
      secondary: { main: neonCyan },
      ...(mode === 'dark'
        ? {
            background: { default: slate900, paper: slate800 },
            text: { primary: '#EAF2FF', secondary: '#A9B4D0' },
          }
        : {
            background: { default: '#F6F7FB', paper: '#FFFFFF' },
            text: { primary: '#0F1221', secondary: '#475073' },
          }),
    },
    components: {
      ...common.components,
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(234,242,255,0.12)' : 'rgba(15,18,33,0.12)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? alpha(neonPrimary, 0.4) : alpha(neonPrimary, 0.6),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: neonPrimary,
              boxShadow: `0 0 0 2px ${alpha(neonPrimary, 0.2)}`,
            },
            // Autofill text color should reflect theme mode
            '& input:-webkit-autofill': {
              WebkitTextFillColor: mode === 'dark' ? '#EAF2FF' : '#0F1221',
              caretColor: mode === 'dark' ? '#EAF2FF' : '#0F1221',
              transition: 'background-color 99999s ease-in-out 0s',
              WebkitBoxShadow: '0 0 0px 1000px transparent inset',
            },
            '&:-webkit-autofill': {
              WebkitTextFillColor: mode === 'dark' ? '#EAF2FF' : '#0F1221',
              caretColor: mode === 'dark' ? '#EAF2FF' : '#0F1221',
              transition: 'background-color 99999s ease-in-out 0s',
              WebkitBoxShadow: '0 0 0px 1000px transparent inset',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#A9B4D0' : '#475073',
            '&.Mui-focused': { color: neonPrimary },
          },
        },
      },
    },
  }));
