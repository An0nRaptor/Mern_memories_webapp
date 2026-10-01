import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography, useMediaQuery, useTheme
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useCreatePostMutation, useGetTagsQuery, useUpdatePostMutation, useUploadPhotoMutation } from "../features/api.js";
import { compressImage } from "../utils.js";

const EMPTY = { title: "", message: "", tags: [], photo: "" };

// Create or edit a memory. `post` = null for a new one.
export default function PostEditor({ open, post, onClose }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const navigate = useNavigate();
    const fileInput = useRef(null);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState("");
    const { data: popular = [] } = useGetTagsQuery(undefined, { skip: !open });
    const [createPost, create] = useCreatePostMutation();
    const [updatePost, update] = useUpdatePostMutation();
    const [uploadPhoto, upload] = useUploadPhotoMutation();
    const saving = create.isLoading || update.isLoading;

    useEffect(() => {
        if (open) {
            setForm(post ? { title: post.title, message: post.message, tags: post.tags || [], photo: post.photo || "" } : EMPTY);
            setError("");
        }
    }, [open, post]);

    const pickPhoto = async file => {
        if (!file) return;
        setError("");
        try {
            const { url } = await uploadPhoto(await compressImage(file)).unwrap();
            setForm(f => ({ ...f, photo: url }));
        } catch (err) {
            setError(err.message);
        }
        if (fileInput.current) fileInput.current.value = "";
    };

    const submit = async e => {
        e.preventDefault();
        setError("");
        try {
            const saved = post
                ? await updatePost({ id: post._id, ...form }).unwrap()
                : await createPost(form).unwrap();
            onClose();
            if (!post) navigate(`/posts/${saved._id}`);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth component="form" onSubmit={submit} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 4 } }}>
            <DialogTitle sx={{ pr: 6 }}>
                {post ? "Edit memory" : "Share a memory"}
                <IconButton onClick={onClose} disabled={saving} aria-label="Close" sx={{ position: "absolute", right: 12, top: 12 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2.5}>
                    {form.photo ? (
                        <Box sx={{ position: "relative", borderRadius: 3, overflow: "hidden" }}>
                            <Box component="img" src={form.photo} alt="" sx={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
                            <Stack direction="row" spacing={1} sx={{ position: "absolute", right: 12, bottom: 12 }}>
                                <Button size="small" variant="contained" color="inherit" onClick={() => fileInput.current?.click()} sx={{ bgcolor: "background.paper" }}>Change</Button>
                                <Button size="small" variant="contained" color="error" onClick={() => setForm(f => ({ ...f, photo: "" }))}>Remove</Button>
                            </Stack>
                        </Box>
                    ) : (
                        <Button
                            variant="outlined"
                            onClick={() => fileInput.current?.click()}
                            disabled={upload.isLoading}
                            sx={{ borderStyle: "dashed", borderRadius: 3, py: 4, flexDirection: "column", gap: 1 }}
                        >
                            <AddPhotoAlternateOutlinedIcon fontSize="large" />
                            {upload.isLoading ? "Uploading…" : "Add a photo"}
                            <Typography variant="caption" color="text.secondary">JPG or PNG, resized automatically</Typography>
                        </Button>
                    )}
                    <input ref={fileInput} type="file" accept="image/*" hidden onChange={e => pickPhoto(e.target.files?.[0])} />

                    <TextField label="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} inputProps={{ maxLength: 120 }} />
                    <TextField
                        label="Your story"
                        required
                        multiline
                        minRows={4}
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        inputProps={{ maxLength: 5000 }}
                        helperText={`${form.message.length}/5000`}
                    />
                    <Autocomplete
                        multiple
                        freeSolo
                        options={popular.map(t => t.tag)}
                        value={form.tags}
                        onChange={(_e, tags) => setForm(f => ({ ...f, tags: tags.slice(0, 8) }))}
                        renderTags={(value, getTagProps) =>
                            value.map((tag, index) => {
                                const { key, ...props } = getTagProps({ index });
                                return <Chip key={key} label={`#${tag}`} size="small" {...props} />;
                            })
                        }
                        renderInput={params => <TextField {...params} label="Tags" placeholder="Type a tag and press Enter" helperText="Up to 8, e.g. goa, beach, sunset" />}
                    />
                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={saving} color="inherit">Cancel</Button>
                <LoadingButton type="submit" variant="contained" loading={saving} disabled={upload.isLoading}>
                    {post ? "Save changes" : "Post memory"}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}
