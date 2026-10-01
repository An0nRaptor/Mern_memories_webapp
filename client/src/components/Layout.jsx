import { useEffect, useState } from "react";
import { Link as RouterLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import {
    AppBar, Box, Button, Container, Divider, IconButton, InputBase, Link, ListItemIcon, Menu, MenuItem, Stack, Toolbar, Tooltip, Typography, alpha
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import { useColorMode } from "../theme.jsx";
import { UserAvatar, useEditor, useRequireUser, useSession } from "./common.jsx";

export function Logo() {
    return (
        <Stack component={RouterLink} to="/" direction="row" alignItems="center" spacing={1.25} sx={{ textDecoration: "none", color: "text.primary" }} aria-label="Memories home">
            <Box component="img" src="/favicon.svg" alt="" sx={{ width: 34, height: 34 }} />
            <Typography variant="h6" sx={{ display: { xs: "none", sm: "block" }, fontWeight: 800, letterSpacing: "-0.02em" }}>memories</Typography>
        </Stack>
    );
}

function SearchBox() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [q, setQ] = useState(params.get("q") || "");
    useEffect(() => {
        setQ(params.get("q") || "");
    }, [params]);

    return (
        <Box
            component="form"
            role="search"
            onSubmit={e => {
                e.preventDefault();
                navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
            }}
            sx={theme => ({
                flex: 1,
                maxWidth: 460,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.5,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.text.primary, 0.05),
                "&:focus-within": { bgcolor: "background.paper", boxShadow: `0 0 0 2px ${theme.palette.primary.main}` }
            })}
        >
            <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <InputBase value={q} onChange={e => setQ(e.target.value)} placeholder="Search memories, places, #tags" fullWidth inputProps={{ "aria-label": "Search memories" }} />
        </Box>
    );
}

function AccountMenu() {
    const { user, signOut } = useSession();
    const [anchor, setAnchor] = useState(null);
    const navigate = useNavigate();

    if (!user) {
        return (
            <Stack direction="row" spacing={1}>
                <Button component={RouterLink} to="/login" color="inherit">Log in</Button>
                <Button component={RouterLink} to="/register" variant="contained" sx={{ display: { xs: "none", sm: "inline-flex" } }}>Sign up</Button>
            </Stack>
        );
    }
    return (
        <>
            <IconButton onClick={e => setAnchor(e.currentTarget)} aria-label="Account menu" sx={{ p: 0.5 }}>
                <UserAvatar name={user.name} size={36} />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} onClick={() => setAnchor(null)} transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => navigate(`/u/${user.id}`)}><ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon> My profile</MenuItem>
                <MenuItem onClick={() => { signOut(); navigate("/"); }}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon> Log out</MenuItem>
            </Menu>
        </>
    );
}

export default function Layout() {
    const { mode, toggle } = useColorMode();
    const { openEditor } = useEditor();
    const requireUser = useRequireUser();

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <AppBar position="sticky" sx={theme => ({ bgcolor: alpha(theme.palette.background.paper, 0.85), backdropFilter: "blur(12px)", borderBottom: 1, borderColor: "divider" })}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 64, sm: 70 } }}>
                        <Logo />
                        <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
                            <SearchBox />
                        </Box>
                        <Box sx={{ flex: 1, display: { md: "none" } }} />
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => requireUser(() => openEditor(null))} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                            Share
                        </Button>
                        <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
                            <IconButton onClick={toggle} aria-label="Toggle dark mode">
                                {mode === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
                            </IconButton>
                        </Tooltip>
                        <AccountMenu />
                    </Toolbar>
                    <Box sx={{ display: { md: "none" }, pb: 1.5 }}>
                        <SearchBox />
                    </Box>
                </Container>
            </AppBar>

            <Box component="main" sx={{ flex: 1, py: { xs: 3, md: 4 } }}>
                <Outlet />
            </Box>

            {/* Mobile: floating share button */}
            <Button
                variant="contained"
                onClick={() => requireUser(() => openEditor(null))}
                aria-label="Share a memory"
                sx={{ display: { sm: "none" }, position: "fixed", right: 16, bottom: 20, minWidth: 0, width: 56, height: 56, borderRadius: "50%", boxShadow: 6, zIndex: 10 }}
            >
                <AddIcon />
            </Button>

            <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", py: 3 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={1}>
                        <Logo />
                        <Typography variant="body2" color="text.secondary">
                            A portfolio project by <Link href="https://my-portfoliosite07.netlify.app" fontWeight={600}>Rahul Yadav</Link>
                            {" · "}
                            <Link href="https://github.com/An0nRaptor/Mern_memories_webapp">Source on GitHub</Link>
                        </Typography>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
}
