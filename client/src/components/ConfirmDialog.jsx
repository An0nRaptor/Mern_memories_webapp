import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

export default function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", loading, onClose, onConfirm }) {
    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} onClick={e => e.stopPropagation()} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            {body && (
                <DialogContent>
                    <DialogContentText>{body}</DialogContentText>
                </DialogContent>
            )}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
                <LoadingButton onClick={onConfirm} loading={loading} variant="contained" color="error">{confirmLabel}</LoadingButton>
            </DialogActions>
        </Dialog>
    );
}
