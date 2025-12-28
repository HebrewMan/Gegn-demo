import { User, AuthResult } from '../types';

const USERS_STORAGE_KEY = 'gmgn_users_data';
const INITIAL_BNB_BALANCE = 1000;

// Read users from localStorage (simulating JSON file)
const readUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading users data:', error);
  }
  return [];
};

// Write users to localStorage (simulating JSON file)
const writeUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users data:', error);
  }
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Register with email
export const registerWithEmail = async (email: string): Promise<AuthResult> => {
  // Validate email
  if (!validateEmail(email)) {
    return {
      success: false,
      message: '邮箱格式不正确',
    };
  }

  const users = readUsers();
  
  // Check if user already exists
  const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return {
      success: false,
      message: '该邮箱已注册，请直接登录',
    };
  }

  // Create new user
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email: email.toLowerCase(),
    authType: 'email',
    balance: INITIAL_BNB_BALANCE,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  users.push(newUser);
  writeUsers(users);

  return {
    success: true,
    message: '注册成功',
    user: newUser,
  };
};

// Register with MetaMask
export const registerWithMetaMask = async (walletAddress: string, signature: string): Promise<AuthResult> => {
  // Validate wallet address
  if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    return {
      success: false,
      message: '钱包地址格式不正确',
    };
  }

  const users = readUsers();
  
  // Check if user already exists
  const existingUser = users.find(u => u.walletAddress?.toLowerCase() === walletAddress.toLowerCase());
  if (existingUser) {
    return {
      success: false,
      message: '该钱包已注册，请直接登录',
    };
  }

  // Create new user
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    walletAddress: walletAddress.toLowerCase(),
    authType: 'metamask',
    balance: INITIAL_BNB_BALANCE,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  users.push(newUser);
  writeUsers(users);

  return {
    success: true,
    message: '注册成功',
    user: newUser,
  };
};

// Login with email
export const loginWithEmail = async (email: string): Promise<AuthResult> => {
  const users = readUsers();
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return {
      success: false,
      message: '该邮箱未注册，请先注册',
    };
  }

  // Update last login time
  user.lastLoginAt = Date.now();
  writeUsers(users);

  return {
    success: true,
    message: '登录成功',
    user,
  };
};

// Login with MetaMask
export const loginWithMetaMask = async (walletAddress: string): Promise<AuthResult> => {
  const users = readUsers();
  const user = users.find(u => u.walletAddress?.toLowerCase() === walletAddress.toLowerCase());
  
  if (!user) {
    return {
      success: false,
      message: '该钱包未注册，请先注册',
    };
  }

  // Update last login time
  user.lastLoginAt = Date.now();
  writeUsers(users);

  return {
    success: true,
    message: '登录成功',
    user,
  };
};

// Get user by ID
export const getUserById = (userId: string): User | null => {
  const users = readUsers();
  return users.find(u => u.id === userId) || null;
};

// Update user balance
export const updateUserBalance = (userId: string, newBalance: number): boolean => {
  const users = readUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return false;
  }

  user.balance = newBalance;
  writeUsers(users);
  return true;
};

