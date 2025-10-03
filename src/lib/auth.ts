export type UserRole = 'admin' | 'manager';

export interface User {
  email: string;
  role: UserRole;
}

const MOCK_USERS: Record<string, { password: string; role: UserRole }> = {
  'admin@app.com': { password: '123', role: 'admin' },
  'manager@app.com': { password: '123', role: 'manager' },
};

export const authenticateUser = (email: string, password: string): User | null => {
  const user = MOCK_USERS[email];
  if (user && user.password === password) {
    return { email, role: user.role };
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('ash-crm-user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('ash-crm-user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ash-crm-user');
  }
};

export const logout = () => {
  setCurrentUser(null);
};
