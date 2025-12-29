import React, { useState, useEffect } from 'react';

import { AppBar, Avatar, Button, Stack, Toolbar, Typography, useTheme, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut, onAuthStateChanged } from 'firebase/auth';

import { auth } from '../config/firebase';
import { Dashboard } from '../components/Dashboard';
import { useInspectorDrawerOpen, useSamplesDrawerOpen, useDocument } from '../documents/editor/EditorContext';
import { saveTemplate, getTemplate } from '../services/templateService';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { resetDocument } from '../documents/editor/EditorContext';
import EMPTY_EMAIL_MESSAGE from '../getConfiguration/sample/empty-email-message';

import InspectorDrawer, { INSPECTOR_DRAWER_WIDTH } from './InspectorDrawer';
import SamplesDrawer, { SAMPLES_DRAWER_WIDTH } from './SamplesDrawer';
import TemplatePanel from './TemplatePanel';

function useDrawerTransition(cssProperty: 'margin-left' | 'margin-right', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProperty, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open ? transitions.duration.leavingScreen : transitions.duration.enteringScreen,
  });
}

function EditorView({
  user,
  currentTemplateId,
  currentTemplateName,
  onBack,
  onTemplateSaved,
}: {
  user: any;
  currentTemplateId: string | null;
  currentTemplateName: string;
  onBack: () => void;
  onTemplateSaved: (id: string, name: string) => void;
}) {
  const inspectorDrawerOpen = useInspectorDrawerOpen();
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const editorDocument = useDocument();
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState(currentTemplateName || '');

  const marginLeftTransition = useDrawerTransition('margin-left', samplesDrawerOpen);
  const marginRightTransition = useDrawerTransition('margin-right', inspectorDrawerOpen);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !newTemplateName.trim()) return;

    try {
      setLoading(true);
      const jsonConfig = editorDocument || {};
      let htmlOutput = '';
      try {
        htmlOutput = renderToStaticMarkup(jsonConfig, { rootBlockId: 'root' });
      } catch (e) {
        console.warn('Could not render HTML:', e);
      }

      const templateId = await saveTemplate(
        user.uid,
        currentTemplateId,
        newTemplateName,
        jsonConfig,
        htmlOutput
      );

      onTemplateSaved(templateId, newTemplateName);
      setSaveMessage('Template saved successfully!');
      setOpenSaveDialog(false);

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveMessage('Error saving template');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          left: samplesDrawerOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          right: inspectorDrawerOpen ? `${INSPECTOR_DRAWER_WIDTH}px` : 0,
          transition: [marginLeftTransition, marginRightTransition].join(', '),
          zIndex: 1300,
        }}
      >
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {currentTemplateName || 'Untitled Template'}
          </Typography>
          {user && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<SaveIcon />}
                onClick={() => {
                  if (currentTemplateName) {
                    handleSave();
                  } else {
                    setNewTemplateName('');
                    setOpenSaveDialog(true);
                  }
                }}
                disabled={loading}
              >
                Save
              </Button>
              <Avatar
                src={user.photoURL || ''}
                alt={user.displayName || 'User'}
                sx={{ width: 32, height: 32 }}
              >
                {!user.photoURL && (user.displayName || user.email)?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2">{user.displayName || user.email}</Typography>
              <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {saveMessage && (
        <Alert
          severity={saveMessage.includes('successfully') ? 'success' : 'error'}
          sx={{ position: 'fixed', top: 80, left: 0, right: 0, borderRadius: 0, zIndex: 1300 }}
        >
          {saveMessage}
        </Alert>
      )}

      <Stack sx={{ marginTop: '64px' }}>
        <InspectorDrawer />
        <SamplesDrawer />

        <Stack
          sx={{
            marginRight: inspectorDrawerOpen ? `${INSPECTOR_DRAWER_WIDTH}px` : 0,
            marginLeft: samplesDrawerOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
            transition: [marginLeftTransition, marginRightTransition].join(', '),
          }}
        >
          <TemplatePanel />
        </Stack>
      </Stack>

      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Template</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Template Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Enter template name"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaveDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!newTemplateName.trim() || loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTemplateSelect = async (templateId: string) => {
    try {
      if (user) {
        const template = await getTemplate(user.uid, templateId);
        if (template) {
          setCurrentTemplateId(templateId);
          setCurrentTemplateName(template.name);
          // Load the template's saved configuration into the editor
          resetDocument(template.jsonConfig);
          setView('editor');
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const handleCreateNew = () => {
    setCurrentTemplateId(null);
    setCurrentTemplateName('');
    resetDocument(EMPTY_EMAIL_MESSAGE);
    setView('editor');
  };

  const handleTemplateSaved = (id: string, name: string) => {
    setCurrentTemplateId(id);
    setCurrentTemplateName(name);
  };

  // if (view === 'dashboard') {
  //   return (
  //     <Dashboard
  //       onTemplateSelect={handleTemplateSelect}
  //       onCreateNew={handleCreateNew}
  //     />
  //   );
  // }

  return (
    view === 'dashboard' ? (
      <Dashboard
        onTemplateSelect={handleTemplateSelect}
        onCreateNew={handleCreateNew}
      />
    ) : (
      <EditorView
        user={user}
        currentTemplateId={currentTemplateId}
        currentTemplateName={currentTemplateName}
        onBack={() => setView('dashboard')}
        onTemplateSaved={handleTemplateSaved}
      />
    )
  );
}

export default function App() {
  return <AppContent />;
}
