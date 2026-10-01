import { useSelector } from "react-redux";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
    Alert, Box, Button, Card, CardContent, Chip, Container, Pagination, Skeleton, Stack, Tab, Tabs, Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Masonry from "@mui/lab/Masonry";
import TagIcon from "@mui/icons-material/Tag";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useGetPostsQuery, useGetTagsQuery } from "../features/api.js";
import { selectUser } from "../features/authSlice.js";
import PostCard from "../components/PostCard.jsx";
import { EmptyState, UserAvatar, useEditor, useRequireUser } from "../components/common.jsx";

function CardSkeleton({ tall }) {
    return (
        <Card>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 2 }}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton width="40%" />
            </Stack>
            <Skeleton variant="rectangular" height={tall ? 260 : 160} />
            <CardContent>
                <Skeleton width="70%" height={28} />
                <Skeleton />
                <Skeleton width="60%" />
            </CardContent>
        </Card>
    );
}

function Sidebar() {
    const { data: tags, isLoading } = useGetTagsQuery();
    const user = useSelector(selectUser);
    const { openEditor } = useEditor();
    const requireUser = useRequireUser();
    const [params] = useSearchParams();
    const active = params.get("tag");

    return (
        <Stack spacing={2.5} sx={{ position: { md: "sticky" }, top: { md: 100 } }}>
            <Card sx={theme => ({ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, color: "#fff", border: 0 })}>
                <CardContent sx={{ p: 3 }}>
                    {user ? (
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <UserAvatar name={user.name} size={40} sx={{ border: "2px solid rgba(255,255,255,.7)" }} />
                            <Typography fontWeight={700}>Hi, {user.name.split(" ")[0]}!</Typography>
                        </Stack>
                    ) : (
                        <AutoAwesomeIcon sx={{ mb: 1 }} />
                    )}
                    <Typography variant="h6" sx={{ mb: 0.5 }}>Got a story to tell?</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>Share a photo and a few words from a place you loved.</Typography>
                    <Button variant="contained" color="inherit" onClick={() => requireUser(() => openEditor(null))} sx={{ color: "primary.main", bgcolor: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,.9)" } }}>
                        Share a memory
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <TagIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle1" fontWeight={700}>Trending tags</Typography>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {isLoading
                            ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} variant="rounded" width={70} height={28} />)
                            : tags?.map(({ tag, count }) => (
                                  <Chip
                                      key={tag}
                                      label={`#${tag} · ${count}`}
                                      component={RouterLink}
                                      to={active === tag ? "/" : `/?tag=${tag}`}
                                      clickable
                                      color={active === tag ? "primary" : "default"}
                                      variant={active === tag ? "filled" : "outlined"}
                                  />
                              ))}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}

export default function Feed() {
    const [params, setParams] = useSearchParams();
    const user = useSelector(selectUser);
    const q = params.get("q") || "";
    const tag = params.get("tag") || "";
    const view = params.get("view") || "latest";
    const page = Number(params.get("page")) || 1;

    const query = { page, ...(q && { q }), ...(tag && { tag }), ...(view === "popular" && { sort: "popular" }), ...(view === "liked" && { liked: "me" }) };
    const { data, isFetching, isLoading, error } = useGetPostsQuery(query, { skip: view === "liked" && !user });

    const update = changes => {
        const next = new URLSearchParams(params);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        if (!("page" in changes)) next.delete("page");
        setParams(next);
        if ("page" in changes) window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const heading = q ? `Results for “${q}”` : tag ? `#${tag}` : null;

    return (
        <Container maxWidth="lg">
            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 8.5 }}>
                    {heading ? (
                        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2.5 }}>
                            <Typography variant="h4" component="h1">{heading}</Typography>
                            <Button component={RouterLink} to="/" size="small">Clear</Button>
                        </Stack>
                    ) : (
                        <Tabs value={view} onChange={(_e, v) => update({ view: v === "latest" ? "" : v })} sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }}>
                            <Tab value="latest" label="Latest" />
                            <Tab value="popular" label="Popular" />
                            {user && <Tab value="liked" label="Liked by me" />}
                        </Tabs>
                    )}

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

                    {isLoading ? (
                        <Masonry columns={{ xs: 1, sm: 2 }} spacing={2.5}>
                            {[1, 0, 0, 1].map((t, i) => <CardSkeleton key={i} tall={t} />)}
                        </Masonry>
                    ) : data?.posts.length === 0 ? (
                        q || tag ? (
                            <EmptyState icon={<SearchOffIcon />} title="No memories found" action={<Button component={RouterLink} to="/" variant="outlined">See all memories</Button>}>
                                Try another word or tag.
                            </EmptyState>
                        ) : (
                            <EmptyState icon={<AutoAwesomeIcon />} title={view === "liked" ? "Nothing liked yet" : "No memories yet"}>
                                {view === "liked" ? "Tap the heart on a memory and it will show up here." : "Be the first to share one."}
                            </EmptyState>
                        )
                    ) : (
                        <Box sx={{ opacity: isFetching ? 0.6 : 1, transition: "opacity .2s", mr: -2.5 }}>
                            <Masonry columns={{ xs: 1, sm: 2 }} spacing={2.5}>
                                {data?.posts.map(post => <PostCard key={post._id} post={post} />)}
                            </Masonry>
                        </Box>
                    )}

                    {data?.totalPages > 1 && (
                        <Stack alignItems="center" sx={{ mt: 4 }}>
                            <Pagination count={data.totalPages} page={page} onChange={(_e, p) => update({ page: p > 1 ? String(p) : "" })} color="primary" shape="rounded" />
                        </Stack>
                    )}
                </Grid>
                <Grid size={{ xs: 12, md: 3.5 }}>
                    <Sidebar />
                </Grid>
            </Grid>
        </Container>
    );
}
