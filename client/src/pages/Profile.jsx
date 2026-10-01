import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import {
    Alert, Box, Button, Card, CardContent, Container, Dialog, DialogActions, DialogContent, DialogTitle, Pagination, Skeleton, Stack, TextField, Typography
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import Masonry from "@mui/lab/Masonry";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import { useGetPostsQuery, useGetUserQuery, useUpdateMeMutation } from "../features/api.js";
import { selectUser, userUpdated } from "../features/authSlice.js";
import { fullDate } from "../utils.js";
import PostCard from "../components/PostCard.jsx";
import { EmptyState, UserAvatar, useEditor } from "../components/common.jsx";

function EditProfile({ open, onClose, user }) {
    const dispatch = useDispatch();
    const [name, setName] = useState(user.name);
    const [bio, setBio] = useState(user.bio || "");
    const [updateMe, { isLoading, error }] = useUpdateMeMutation();
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth component="form" onSubmit={async e => {
            e.preventDefault();
            try {
                const { user: updated } = await updateMe({ name, bio }).unwrap();
                dispatch(userUpdated(updated));
                onClose();
            } catch {
                /* shown below */
            }
        }}>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField label="Name" required value={name} onChange={e => setName(e.target.value)} inputProps={{ maxLength: 60 }} />
                    <TextField label="Bio" multiline minRows={2} value={bio} onChange={e => setBio(e.target.value)} inputProps={{ maxLength: 160 }} helperText={`${bio.length}/160`} />
                    {error && <Alert severity="error">{error.message}</Alert>}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <LoadingButton type="submit" variant="contained" loading={isLoading}>Save</LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

export default function Profile() {
    const { id } = useParams();
    const [params, setParams] = useSearchParams();
    const page = Number(params.get("page")) || 1;
    const me = useSelector(selectUser);
    const isMe = me && String(me.id) === id;
    const { openEditor } = useEditor();
    const [editing, setEditing] = useState(false);
    const { data: profile, error } = useGetUserQuery(id);
    const { data: posts, isLoading } = useGetPostsQuery({ author: id, page });

    if (error) {
        return <Container maxWidth="md"><EmptyState title="User not found">{error.message}</EmptyState></Container>;
    }

    const stats = profile && [
        ["Memories", profile.stats.posts],
        ["Likes received", profile.stats.likes],
        ["Comments", profile.stats.comments]
    ];

    return (
        <Container maxWidth="lg">
            <Card sx={{ mb: 4, overflow: "hidden" }}>
                <Box sx={theme => ({ height: 120, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` })} />
                <CardContent sx={{ pt: 0, px: { xs: 2.5, md: 4 } }}>
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "flex-end" }} spacing={2} sx={{ mt: -5 }}>
                        <UserAvatar name={profile?.user.name || "?"} size={96} sx={{ border: 4, borderColor: "background.paper", fontSize: 36 }} />
                        <Box sx={{ flex: 1, pb: 0.5 }}>
                            {profile ? (
                                <>
                                    <Typography variant="h4" component="h1">{profile.user.name}</Typography>
                                    <Typography color="text.secondary">Joined {fullDate(profile.user.createdAt)}</Typography>
                                </>
                            ) : (
                                <Skeleton width={220} height={48} />
                            )}
                        </Box>
                        {isMe && (
                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setEditing(true)}>Edit profile</Button>
                                <Button variant="contained" onClick={() => openEditor(null)}>Share</Button>
                            </Stack>
                        )}
                    </Stack>
                    {profile?.user.bio && <Typography sx={{ mt: 2, maxWidth: 600 }}>{profile.user.bio}</Typography>}
                    <Stack direction="row" spacing={4} sx={{ mt: 2.5 }}>
                        {(stats || [["", ""], ["", ""], ["", ""]]).map(([label, value], i) => (
                            <Box key={label || i}>
                                <Typography variant="h5">{profile ? value : <Skeleton width={30} />}</Typography>
                                <Typography variant="body2" color="text.secondary">{label || <Skeleton width={70} />}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </CardContent>
            </Card>

            {isLoading ? null : posts?.posts.length === 0 ? (
                <EmptyState icon={<PhotoLibraryOutlinedIcon />} title={isMe ? "You haven’t shared anything yet" : "No memories yet"} action={isMe && <Button variant="contained" onClick={() => openEditor(null)}>Share your first memory</Button>} />
            ) : (
                <Box sx={{ mr: -2.5 }}>
                    <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2.5}>
                        {posts?.posts.map(p => <PostCard key={p._id} post={p} />)}
                    </Masonry>
                </Box>
            )}
            {posts?.totalPages > 1 && (
                <Stack alignItems="center" sx={{ mt: 3 }}>
                    <Pagination count={posts.totalPages} page={page} onChange={(_e, p) => setParams(p > 1 ? { page: String(p) } : {})} color="primary" shape="rounded" />
                </Stack>
            )}
            {isMe && editing && <EditProfile open onClose={() => setEditing(false)} user={me} />}
        </Container>
    );
}
