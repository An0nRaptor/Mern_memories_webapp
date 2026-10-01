import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
    Box, Card, CardActionArea, CardContent, CardMedia, Chip, IconButton, ListItemIcon, Menu, MenuItem, Stack, Tooltip, Typography
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useSelector } from "react-redux";
import { useDeletePostMutation, useToggleLikeMutation } from "../features/api.js";
import { selectUser } from "../features/authSlice.js";
import { timeAgo } from "../utils.js";
import { UserAvatar, useEditor, useRequireUser } from "./common.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

export function LikeButton({ post, size = "medium", showCount = true }) {
    const [toggleLike] = useToggleLikeMutation();
    const requireUser = useRequireUser();
    return (
        <Stack direction="row" alignItems="center">
            <Tooltip title={post.likedByMe ? "Unlike" : "Like"}>
                <IconButton
                    size={size}
                    onClick={e => {
                        e.stopPropagation();
                        requireUser(() => toggleLike(post._id));
                    }}
                    aria-pressed={post.likedByMe}
                    aria-label={post.likedByMe ? "Unlike" : "Like"}
                    sx={{ color: post.likedByMe ? "secondary.main" : "text.secondary", transition: "transform .15s", "&:active": { transform: "scale(1.25)" } }}
                >
                    {post.likedByMe ? <FavoriteIcon fontSize="inherit" /> : <FavoriteBorderIcon fontSize="inherit" />}
                </IconButton>
            </Tooltip>
            {showCount && <Typography variant="body2" fontWeight={600} color="text.secondary">{post.likeCount}</Typography>}
        </Stack>
    );
}

export function OwnerMenu({ post, onDeleted }) {
    const [anchor, setAnchor] = useState(null);
    const [confirm, setConfirm] = useState(false);
    const { openEditor } = useEditor();
    const [deletePost, { isLoading }] = useDeletePostMutation();

    return (
        <>
            <IconButton size="small" aria-label="Memory options" onClick={e => { e.stopPropagation(); setAnchor(e.currentTarget); }}>
                <MoreHorizIcon />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} onClick={e => e.stopPropagation()}>
                <MenuItem onClick={() => { setAnchor(null); openEditor(post); }}>
                    <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon> Edit
                </MenuItem>
                <MenuItem onClick={() => { setAnchor(null); setConfirm(true); }} sx={{ color: "error.main" }}>
                    <ListItemIcon><DeleteOutlineIcon fontSize="small" color="error" /></ListItemIcon> Delete
                </MenuItem>
            </Menu>
            <ConfirmDialog
                open={confirm}
                title="Delete this memory?"
                body="It will be removed for everyone, along with its likes and comments."
                confirmLabel="Delete"
                loading={isLoading}
                onClose={() => setConfirm(false)}
                onConfirm={async () => {
                    await deletePost(post._id).unwrap().catch(() => {});
                    setConfirm(false);
                    onDeleted?.();
                }}
            />
        </>
    );
}

export default function PostCard({ post }) {
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const mine = user && String(user.id) === String(post.author?._id);
    const open = () => navigate(`/posts/${post._id}`);

    return (
        <Card sx={{ overflow: "hidden", transition: "box-shadow .2s, transform .2s", "&:hover": { boxShadow: 6, transform: "translateY(-2px)" } }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2, pt: 1.75, pb: 1.25 }}>
                <RouterLink to={`/u/${post.author?._id}`} onClick={e => e.stopPropagation()} style={{ display: "flex", textDecoration: "none", color: "inherit", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <UserAvatar name={post.author?.name} size={32} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>{post.author?.name || "Unknown"}</Typography>
                        <Typography variant="caption" color="text.secondary">{timeAgo(post.createdAt)}</Typography>
                    </Box>
                </RouterLink>
                {mine && <OwnerMenu post={post} />}
            </Stack>

            <CardActionArea onClick={open}>
                {post.photo && <CardMedia component="img" image={post.photo} alt={post.title} loading="lazy" sx={{ maxHeight: 420, objectFit: "cover" }} />}
                <CardContent sx={{ pb: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3, mb: 0.75 }}>{post.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>{post.message}</Typography>
                </CardContent>
            </CardActionArea>

            {post.tags?.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ px: 2, pb: 1 }}>
                    {post.tags.map(tag => (
                        <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" clickable component={RouterLink} to={`/?tag=${tag}`} />
                    ))}
                </Stack>
            )}

            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1, pb: 1 }}>
                <LikeButton post={post} />
                <Stack direction="row" alignItems="center" sx={{ color: "text.secondary" }}>
                    <IconButton size="medium" onClick={open} aria-label="Comments" sx={{ color: "inherit" }}>
                        <ChatBubbleOutlineIcon fontSize="inherit" />
                    </IconButton>
                    <Typography variant="body2" fontWeight={600}>{post.commentCount}</Typography>
                </Stack>
            </Stack>
        </Card>
    );
}
