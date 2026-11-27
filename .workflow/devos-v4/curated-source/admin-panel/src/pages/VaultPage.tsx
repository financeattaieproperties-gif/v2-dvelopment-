import React from 'react';
import { DigitalVault } from '../../../shared/DigitalVault';
import { useAuth } from '../context/AuthContext';

export default function VaultPage() {
  const { firebaseUser } = useAuth();
  const userName = firebaseUser?.displayName || firebaseUser?.email || 'Admin Staff';
  const userUid = firebaseUser?.uid || 'admin';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <DigitalVault
        apiBaseUrl="/api"
        currentUser={{
          name: userName,
          role: 'admin',
          uid: userUid,
        }}
      />
    </div>
  );
}
