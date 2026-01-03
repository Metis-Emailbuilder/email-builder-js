import React, { useState, useEffect } from 'react';

import { Stack, CircularProgress, Container } from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../config/firebase';
import { Dashboard } from '../components/Dashboard';
import { Login } from '../components/Login';
import { EditorView } from './EditorView';
import { getTemplate } from '../services/templateService';
import { resetDocument } from '../documents/editor/EditorContext';
import EMPTY_EMAIL_MESSAGE from '../getConfiguration/sample/empty-email-message';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
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

  if (authLoading) {
    return (
      <Container>
        <Stack sx={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }

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
