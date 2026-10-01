import { createContext, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { avatarColor, initials } from "../utils.js";
import { api } from "../features/api.js";
import { selectUser, signedIn, signedOut } from "../features/authSlice.js";

export function UserAvatar({ name, size = 36, ...props }) {
    return (
        <Avatar sx={{ width: size, height: size, bgcolor: avatarColor(name), fontSize: size * 0.4, fontWeight: 700 }} {...props}>
            {initials(name)}
        </Avatar>
    );
}

export function EmptyState({ icon, title, children, action }) {
    return (
        <Stack alignItems="center" textAlign="center" spacing={1.5} sx={{ py: 8, px: 3, border: 1, borderColor: "divider", borderStyle: "dashed", borderRadius: 4 }}>
            {icon && <Box sx={{ color: "primary.main", "& svg": { fontSize: 44 } }}>{icon}</Box>}
            <Typography variant="h6">{title}</Typography>
            {children && <Typography color="text.secondary" sx={{ maxWidth: 380 }}>{children}</Typography>}
            {action && <Box sx={{ pt: 1 }}>{action}</Box>}
        </Stack>
    );
}

// Session helpers: also reset cached data, since "liked by me" etc. depend on who's signed in.
export function useSession() {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    return {
        user,
        signIn: data => {
            dispatch(api.util.resetApiState());
            dispatch(signedIn(data));
        },
        signOut: () => {
            dispatch(signedOut());
            dispatch(api.util.resetApiState());
        }
    };
}

// Run `action` if signed in, otherwise send the visitor to log in first.
export function useRequireUser() {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const location = useLocation();
    return action => {
        if (user) return action();
        navigate("/login", { state: { from: location.pathname + location.search } });
    };
}

export const EditorContext = createContext({ openEditor: () => {} });
export const useEditor = () => useContext(EditorContext);

export function LinkButton(props) {
    return <Button component={RouterLink} {...props} />;
}
