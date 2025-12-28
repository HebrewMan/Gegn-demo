import { User, AuthResult } from '../types';
import { 
  getUserByEmail, 
  getUserByWalletAddress, 
  getUserById as getUserByIdFromDb, 
  upsertUser as upsertUserRecord,
  type UserRecord 
} from '../data/database';

const INITIAL_USDT_BALANCE = 1000; // Changed to 1000 USDT as requested

// Convert UserRecord to User (for compatibility)
const userRecordToUser = (record: UserRecord): User => {
  return {
    id: record.user_id,
    email: record.email,
    walletAddress: record.wallet_address,
    authType: record.auth_type || 'email',
    balance: record.balance,
    createdAt: record.created_at,
    lastLoginAt: record.last_login_at,
  };
};

// Convert User to UserRecord
const userToUserRecord = (user: User): UserRecord => {
  return {
    user_id: user.id,
    name: user.email?.split('@')[0] || user.walletAddress?.slice(0, 8) || 'User',
    email: user.email,
    wallet_address: user.walletAddress,
    avatar: undefined,
    balance: user.balance,
    created_at: user.createdAt,
    last_login_at: user.lastLoginAt,
    auth_type: user.authType,
  };
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

  // Check if user already exists
  const existingUserRecord = await getUserByEmail(email);
  if (existingUserRecord) {
    return {
      success: false,
      message: '该邮箱已注册，请直接登录',
    };
  }

  // Create new user record
  const newUserRecord: UserRecord = {
    user_id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: email.split('@')[0],
    email: email.toLowerCase(),
    wallet_address: undefined,
    avatar: undefined,
    balance: INITIAL_USDT_BALANCE,
    created_at: Date.now(),
    last_login_at: Date.now(),
    auth_type: 'email',
  };

  await upsertUserRecord(newUserRecord);

  // Convert to User for compatibility
  const newUser = userRecordToUser(newUserRecord);

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

  // Check if user already exists
  const existingUserRecord = await getUserByWalletAddress(walletAddress);
  if (existingUserRecord) {
    return {
      success: false,
      message: '该钱包已注册，请直接登录',
    };
  }

  // Create new user record
  const newUserRecord: UserRecord = {
    user_id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: walletAddress.slice(0, 8),
    email: undefined,
    wallet_address: walletAddress.toLowerCase(),
    avatar: undefined,
    balance: INITIAL_USDT_BALANCE,
    created_at: Date.now(),
    last_login_at: Date.now(),
    auth_type: 'metamask',
  };

  await upsertUserRecord(newUserRecord);

  // Convert to User for compatibility
  const newUser = userRecordToUser(newUserRecord);

  return {
    success: true,
    message: '注册成功',
    user: newUser,
  };
};

// Login with email
export const loginWithEmail = async (email: string): Promise<AuthResult> => {
  const userRecord = await getUserByEmail(email);
  
  if (!userRecord) {
    return {
      success: false,
      message: '该邮箱未注册，请先注册',
    };
  }

  // Update last login time
  userRecord.last_login_at = Date.now();
  await upsertUserRecord(userRecord);

  // Convert to User for compatibility
  const user = userRecordToUser(userRecord);

  return {
    success: true,
    message: '登录成功',
    user,
  };
};

// Login with MetaMask
export const loginWithMetaMask = async (walletAddress: string): Promise<AuthResult> => {
  const userRecord = await getUserByWalletAddress(walletAddress);
  
  if (!userRecord) {
    return {
      success: false,
      message: '该钱包未注册，请先注册',
    };
  }

  // Update last login time
  userRecord.last_login_at = Date.now();
  await upsertUserRecord(userRecord);

  // Convert to User for compatibility
  const user = userRecordToUser(userRecord);

  return {
    success: true,
    message: '登录成功',
    user,
  };
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  const userRecord = await getUserByIdFromDb(userId);
  return userRecord ? userRecordToUser(userRecord) : null;
};

// Update user balance (this is handled by database.ts updateUserBalance)
// Keeping for compatibility but it's already in database.ts

