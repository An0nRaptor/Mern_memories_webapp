import { createContext, useContext, useMemo, useState } from "react";
import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import "@fontsource-variable/plus-jakarta-sans";

const ModeContext = createContext({ mode: "light", toggle: () => {} });
// eslint-disable-next-line react-refresh/only-export-components
export const useColorMode = () => useContext(ModeContext);

function readSaved() {
    try {
        return localStorage.getItem("memories_mode");
    } catch {
        return null;
    }
}

function buildTheme(mode) {
    const dark = mode === "dark";
    return createTheme({
        palette: {
            mode,
            primary: { main: dark ? "#9d92ff" : "#5b4cdb" },
            secondary: { main: "#e2557a" },
            background: dark ? { default: "#0f0e17", paper: "#18172a" } : { default: "#f6f5fb", paper: "#ffffff" },
            divider: dark ? "rgba(255,255,255,0.08)" : "rgba(20,16,60,0.08)"
        },
        shape: { borderRadius: 14 },
        typography: {
            fontFamily: '"Plus Jakarta Sans Variable", system-ui, sans-serif',
            h1: { fontWeight: 800 },
            h2: { fontWeight: 800 },
            h3: { fontWeight: 800, letterSpacing: "-0.02em" },
            h4: { fontWeight: 800, letterSpacing: "-0.02em" },
            h5: { fontWeight: 700 },
            h6: { fontWeight: 700 },
            button: { textTransform: "none", fontWeight: 700 }
        },
        components: {
            MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 999 } } },
            MuiCard: {
                defaultProps: { elevation: 0 },
                styleOverrides: { root: ({ theme }) => ({ border: `1px solid ${theme.palette.divider}` }) }
            },
            MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
            MuiAppBar: { defaultProps: { elevation: 0, color: "inherit" } },
            MuiTextField: { defaultProps: { fullWidth: true } }
        }
    });
}

export function ColorModeProvider({ children }) {
    const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
    const [saved, setSaved] = useState(readSaved);
    const mode = saved || (prefersDark ? "dark" : "light");
    const theme = useMemo(() => buildTheme(mode), [mode]);
    const value = useMemo(
        () => ({
            mode,
            toggle: () => {
                const next = mode === "dark" ? "light" : "dark";
                setSaved(next);
                try {
                    localStorage.setItem("memories_mode", next);
                } catch {
                    /* ignore */
                }
            }
        }),
        [mode]
    );
    return (
        <ModeContext.Provider value={value}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ModeContext.Provider>
    );
}
