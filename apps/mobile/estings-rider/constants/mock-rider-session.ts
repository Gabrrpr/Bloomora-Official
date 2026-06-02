export type MockExpiredRiderSession = {
  allowScreenLockLogin: boolean;
  rider: {
    displayName: string;
    roleLabel: string;
  };
  status: 'expired';
};

// Temporary auth seed. Delete this file when the real staff session store is wired.
export const mockExpiredRiderSession: MockExpiredRiderSession | null = null;

export const mockRememberedExpiredRiderSession: MockExpiredRiderSession = {
  allowScreenLockLogin: true,
  rider: {
    displayName: 'JULIUS FRANCIS DE LEON',
    roleLabel: 'DELIVERY RIDER',
  },
  status: 'expired',
};
