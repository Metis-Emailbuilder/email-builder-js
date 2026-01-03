import React from 'react';
import { Button, Container, Stack, Typography } from '@mui/material';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';

export function Login() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Stack
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3,
        }}
      >
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
          EmailBuilder.js
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Create beautiful email templates with ease
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleGoogleLogin}
          sx={{
            padding: '12px 32px',
            fontSize: '16px',
            textTransform: 'none',
            backgroundColor: '#1f2937',
            '&:hover': {
              backgroundColor: '#111827',
            },
          }}
        >
          Sign in with Google
        </Button>
      </Stack>
    </Container>
  );
}
