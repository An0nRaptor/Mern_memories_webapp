import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
    Alert, Box, Button, Card, CardActionArea, CardContent, CardMedia, Chip, Container, Divider, IconButton, Skeleton, Stack, TextField, Tooltip, Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import LoadingButton from "@mui/lab/LoadingButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { useAddCommentMutation, useDeleteCommentMutation, useGetPostQuery, useGetRelatedQuery } from "../features/api.js";
import { selectUser } from "../features/authSlice.js";
import { fullDate, timeAgo } from "../utils.js";
import { EmptyState, UserAvatar, useRequireUser } from "../components/common.jsx";
import { LikeButton, OwnerMenu } from "../components/PostCard.jsx";

function Comments({ post }) {
    const user = useSelector(selectUser);
    const requireUser = useRequireUser();
    const [text, setText] = useState("");
    const [addComment, { isLoading, error }] = useAddCommentMutation();
    const [deleteComment] = useDeleteCommentMutation();
    const isOwner = user && String(user.id) === String(post.author?._id);

    const submit = async e => {
        e.preventDefault();
        if (!text.trim()) return;
        requireUser(async () => {
            try {
                await addComment({ id: post._id, text }).unwrap();
                setText("");
            } catch {
                /* shown below */
            }
        });
    };

    return (
        <Box component="section" aria-labelledby="comments-heading">
            <Typography id="comments-heading" variant="h6" sx={{ mb: 2 }}>
                Comments {post.comments.length > 0 && <Typography component="span" color="text.secondary">({post.comments.length})</Typography>}
            </Typography>

            <Stack component="form" onSubmit={submit} direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 3 }}>
                <UserAvatar name={user?.name || "?"} size={36} />
                <Box sx={{ flex: 1 }}>
                    <TextField
                        size="small"
                        multiline
                        maxRows={6}
                        placeholder={user ? "Write a comment…" : "Log in to comment"}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onFocus={() => !user && requireUser(() => {})}
                        inputProps={{ maxLength: 1000, "aria-label": "Write a comment" }}
                    />
                    {error && <Alert severity="error" sx={{ mt: 1 }}>{error.message}</Alert>}
                    {text.trim() && (
                        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1 }}>
                            <Button size="small" color="inherit" onClick={() => setText("")}>Cancel</Button>
                            <LoadingButton size="small" type="submit" variant="contained" loading={isLoading}>Comment</LoadingButton>
                        </Stack>
                    )}
                </Box>
            </Stack>

            <Stack spacing={2.5}>
                {post.comments.length === 0 && <Typography color="text.secondary">No comments yet. Start the conversation.</Typography>}
                {post.comments.map(c => {
                    const canDelete = user && (String(user.id) === String(c.author?._id) || isOwner);
                    return (
                        <Stack key={c._id} direction="row" spacing={1.5}>
                            <RouterLink to={`/u/${c.author?._id}`} style={{ textDecoration: "none" }}><UserAvatar name={c.author?.name} size={36} /></RouterLink>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ bgcolor: "action.hover", borderRadius: 3, px: 2, py: 1.25 }}>
                                    <Typography variant="subtitle2" component={RouterLink} to={`/u/${c.author?._id}`} sx={{ color: "text.primary", textDecoration: "none" }}>
                                        {c.author?.name || "Deleted user"}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", wordBreak: "break-word" }}>{c.text}</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>{timeAgo(c.createdAt)}</Typography>
                            </Box>
                            {canDelete && (
                                <Tooltip title="Delete comment">
                                    <IconButton size="small" onClick={() => deleteComment({ id: post._id, commentId: c._id })} aria-label="Delete comment" sx={{ alignSelf: "flex-start" }}>
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    );
                })}
            </Stack>
        </Box>
    );
}

function Related({ id }) {
    const { data } = useGetRelatedQuery(id);
    if (!data?.length) return null;
    return (
        <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>You might also like</Typography>
            <Grid container spacing={2.5}>
                {data.map(p => (
                    <Grid key={p._id} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ height: "100%" }}>
                            <CardActionArea component={RouterLink} to={`/posts/${p._id}`} sx={{ height: "100%" }}>
                                {p.photo ? <CardMedia component="img" image={p.photo} alt={p.title} height={150} loading="lazy" /> : <Box sx={{ height: 150, bgcolor: "action.hover" }} />}
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} noWrap>{p.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">by {p.author?.name} · {p.likeCount} ♥</Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default function PostPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const { data: post, error, isLoading } = useGetPostQuery(id);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (post) document.title = `${post.title} · Memories`;
        return () => { document.title = "Memories · Share the moments that matter"; };
    }, [post]);

    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) await navigator.share({ title: post.title, url });
            else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
            }
        } catch {
            /* dismissed */
        }
    };

    if (error) {
        return (
            <Container maxWidth="md">
                <EmptyState title="Memory not found" action={<Button component={RouterLink} to="/" variant="outlined">Back to the feed</Button>}>
                    {error.message}
                </EmptyState>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Button startIcon={<ArrowBackIcon />} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} color="inherit" sx={{ mb: 2 }}>
                Back
            </Button>

            {isLoading ? (
                <Card><Skeleton variant="rectangular" height={420} /><CardContent><Skeleton width="50%" height={44} /><Skeleton /><Skeleton /></CardContent></Card>
            ) : (
                <>
                    <Card sx={{ overflow: "hidden" }}>
                        <Grid container>
                            {post.photo && (
                                <Grid size={{ xs: 12, md: 7 }} sx={{ bgcolor: "#000", display: "flex", alignItems: "center" }}>
                                    <Box component="img" src={post.photo} alt={post.title} sx={{ width: "100%", maxHeight: { md: 640 }, objectFit: "contain" }} />
                                </Grid>
                            )}
                            <Grid size={{ xs: 12, md: post.photo ? 5 : 12 }}>
                                <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                                        <RouterLink to={`/u/${post.author?._id}`} style={{ textDecoration: "none" }}><UserAvatar name={post.author?.name} size={44} /></RouterLink>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography fontWeight={700} component={RouterLink} to={`/u/${post.author?._id}`} sx={{ color: "text.primary", textDecoration: "none" }}>
                                                {post.author?.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" title={fullDate(post.createdAt)}>{fullDate(post.createdAt)}</Typography>
                                        </Box>
                                        {user && String(user.id) === String(post.author?._id) && <OwnerMenu post={post} onDeleted={() => navigate("/")} />}
                                    </Stack>

                                    <Typography variant="h4" component="h1" sx={{ mb: 1.5 }}>{post.title}</Typography>
                                    <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>{post.message}</Typography>

                                    {post.tags.length > 0 && (
                                        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2.5 }}>
                                            {post.tags.map(t => <Chip key={t} label={`#${t}`} component={RouterLink} to={`/?tag=${t}`} clickable size="small" color="primary" variant="outlined" />)}
                                        </Stack>
                                    )}

                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2.5 }}>
                                        <LikeButton post={post} size="large" showCount={false} />
                                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                            {post.likeCount === 1 ? "1 like" : `${post.likeCount} likes`}
                                        </Typography>
                                        <Tooltip title={copied ? "Link copied!" : "Share"}>
                                            <IconButton onClick={share} aria-label="Share"><ShareOutlinedIcon /></IconButton>
                                        </Tooltip>
                                    </Stack>

                                    <Divider sx={{ my: 3 }} />
                                    <Comments post={post} />
                                </CardContent>
                            </Grid>
                        </Grid>
                    </Card>
                    <Related id={id} />
                </>
            )}
        </Container>
    );
}
