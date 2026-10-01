import { useState } from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Container, Divider, Link, Stack, TextField, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useLoginMutation, useRegisterMutation } from "../features/api.js";
import { useSession } from "../components/common.jsx";

// Public demo account created by `npm run seed`.
const DEMO = { email: "demo@memories.dev", password: "demo1234" };

export default function AuthPage({ mode }) {
    const isLogin = mode === "login";
    const { user, signIn } = useSession();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/";
    const [login, loginState] = useLoginMutation();
    const [register, registerState] = useRegisterMutation();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const busy = loginState.isLoading || registerState.isLoading;

    if (user) return <Navigate to={from} replace />;

    const run = async promise => {
        setError("");
        try {
            signIn(await promise.unwrap());
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message);
        }
    };
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    return (
        <Container maxWidth="xs" sx={{ py: { xs: 2, md: 6 } }}>
            <Box textAlign="center" sx={{ mb: 3 }}>
                <Box component="img" src="/favicon.svg" alt="" sx={{ width: 52, height: 52, mb: 1.5 }} />
                <Typography variant="h4" component="h1">{isLogin ? "Welcome back" : "Join Memories"}</Typography>
                <Typography color="text.secondary">{isLogin ? "Log in to like, comment and share." : "Share the places and moments you love."}</Typography>
            </Box>
            <Card>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Stack component="form" spacing={2} onSubmit={e => { e.preventDefault(); run(isLogin ? login(form) : register(form)); }}>
                        {!isLogin && <TextField label="Name" required value={form.name} onChange={set("name")} autoComplete="name" />}
                        <TextField label="Email" type="email" required value={form.email} onChange={set("email")} autoComplete="email" />
                        <TextField label="Password" type="password" required value={form.password} onChange={set("password")} autoComplete={isLogin ? "current-password" : "new-password"} inputProps={{ minLength: isLogin ? undefined : 6 }} helperText={isLogin ? undefined : "At least 6 characters"} />
                        {error && <Alert severity="error">{error}</Alert>}
                        <LoadingButton type="submit" variant="contained" size="large" loading={busy}>{isLogin ? "Log in" : "Create account"}</LoadingButton>
                        {isLogin && (
                            <>
                                <Divider>or</Divider>
                                <Button variant="outlined" size="large" startIcon={<AutoAwesomeIcon />} disabled={busy} onClick={() => run(login(DEMO))}>
                                    Try the demo account
                                </Button>
                            </>
                        )}
                    </Stack>
                </CardContent>
            </Card>
            <Typography textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
                {isLogin ? "New here? " : "Already have an account? "}
                <Link component={RouterLink} to={isLogin ? "/register" : "/login"} state={location.state} fontWeight={700}>
                    {isLogin ? "Create an account" : "Log in"}
                </Link>
            </Typography>
        </Container>
    );
}
