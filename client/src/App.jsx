import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, Link as RouterLink } from "react-router-dom";
import { Button, Container } from "@mui/material";
import Layout from "./components/Layout.jsx";
import PostEditor from "./components/PostEditor.jsx";
import { EditorContext, EmptyState } from "./components/common.jsx";
import Feed from "./pages/Feed.jsx";
import PostPage from "./pages/PostPage.jsx";
import Profile from "./pages/Profile.jsx";
import AuthPage from "./pages/AuthPage.jsx";

function ScrollToTop() {
    const { pathname } = useLocation();
    // Braces matter: newer browsers return a Promise from scrollTo, which
    // React would otherwise treat as a cleanup function and crash on.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

export default function App() {
    // One shared create/edit dialog, opened from anywhere via useEditor().
    const [editor, setEditor] = useState({ open: false, post: null });
    const editorApi = useMemo(() => ({ openEditor: post => setEditor({ open: true, post }) }), []);

    return (
        <EditorContext.Provider value={editorApi}>
            <ScrollToTop />
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Feed />} />
                    <Route path="posts/:id" element={<PostPage />} />
                    <Route path="u/:id" element={<Profile />} />
                    <Route path="login" element={<AuthPage mode="login" />} />
                    <Route path="register" element={<AuthPage mode="register" />} />
                    <Route
                        path="*"
                        element={
                            <Container maxWidth="sm">
                                <EmptyState title="Page not found" action={<Button component={RouterLink} to="/" variant="contained">Go to the feed</Button>}>
                                    The page you’re looking for doesn’t exist.
                                </EmptyState>
                            </Container>
                        }
                    />
                </Route>
            </Routes>
            <PostEditor open={editor.open} post={editor.post} onClose={() => setEditor(e => ({ ...e, open: false }))} />
        </EditorContext.Provider>
    );
}
