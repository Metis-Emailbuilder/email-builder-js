import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Template, getUserTemplates, deleteTemplate, saveTemplate, updateTemplate } from '../services/templateService';
import EMPTY_EMAIL_MESSAGE from '../getConfiguration/sample/empty-email-message';

interface DashboardProps {
  onTemplateSelect: (templateId: string) => void;
  onCreateNew: () => void;
}

export function Dashboard({ onTemplateSelect, onCreateNew }: DashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [renameTemplateName, setRenameTemplateName] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchTemplates();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user) {
        const userTemplates = await getUserTemplates(user.uid);
        // Sort by lastModified descending
        userTemplates.sort(
          (a, b) =>
            new Date(b.lastModified as any).getTime() -
            new Date(a.lastModified as any).getTime()
        );
        setTemplates(userTemplates);
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newTemplateName.trim() || !user) return;

    try {
      const templateId = await saveTemplate(user.uid, null, newTemplateName, EMPTY_EMAIL_MESSAGE, '');
      setNewTemplateName('');
      setOpenDialog(false);
      onTemplateSelect(templateId);
    } catch (err) {
      setError('Failed to create template');
      console.error(err);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!user) return;

    try {
      await deleteTemplate(user.uid, templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));
      setAnchorEl(null);
      setSelectedTemplate(null);
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  };

  const handleRenameClick = (template: Template) => {
    setSelectedTemplate(template);
    setRenameTemplateName(template.name);
    setOpenRenameDialog(true);
    setAnchorEl(null);
  };

  const handleRename = async () => {
    if (!renameTemplateName.trim() || !user || !selectedTemplate?.id) return;

    try {
      await updateTemplate(user.uid, selectedTemplate.id, { name: renameTemplateName });
      setTemplates(templates.map((t) =>
        t.id === selectedTemplate.id ? { ...t, name: renameTemplateName } : t
      ));
      setOpenRenameDialog(false);
      setSelectedTemplate(null);
    } catch (err) {
      setError('Failed to rename template');
      console.error(err);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: Template) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Container>
        <Stack sx={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            My Templates
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Template
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {templates.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              No templates yet
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Create Your First Template
            </Button>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.3s',
                  }}
                  onClick={() => template.id && onTemplateSelect(template.id)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                      {template.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      <strong>Modified:</strong>{' '}
                      {template.lastModified && typeof template.lastModified === 'object' && 'toDate' in template.lastModified
                        ? (template.lastModified as any).toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                        : new Date(template.lastModified as any).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 1, textAlign: 'right' }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, template);
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Create New Template Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Template Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="e.g., Welcome Email"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateNew();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateNew}
            variant="contained"
            disabled={!newTemplateName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu for rename and delete */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedTemplate) {
              handleRenameClick(selectedTemplate);
            }
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedTemplate?.id) {
              handleDelete(selectedTemplate.id);
            }
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Rename Template Dialog */}
      <Dialog open={openRenameDialog} onClose={() => setOpenRenameDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Template</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Template Name"
            value={renameTemplateName}
            onChange={(e) => setRenameTemplateName(e.target.value)}
            placeholder="Enter new template name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRename();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRenameDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRename}
            variant="contained"
            disabled={!renameTemplateName.trim()}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
