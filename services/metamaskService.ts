// MetaMask service for wallet connection and signature verification

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask === true;
};

export const connectMetaMask = async (): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('请先安装 MetaMask 钱包');
  }

  try {
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts',
    });

    if (accounts && accounts.length > 0) {
      return accounts[0];
    }

    throw new Error('未获取到钱包地址');
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('用户拒绝了连接请求');
    }
    throw new Error(error.message || '连接钱包失败');
  }
};

export const signMessage = async (address: string, message: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('请先安装 MetaMask 钱包');
  }

  try {
    const signature = await window.ethereum!.request({
      method: 'personal_sign',
      params: [message, address],
    });

    return signature;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('用户拒绝了签名请求');
    }
    throw new Error(error.message || '签名失败');
  }
};

export const getSignMessage = (address: string, timestamp: number): string => {
  return `欢迎使用 GMGN.ai\n\n请签名以验证您的钱包所有权\n\n钱包地址: ${address}\n时间戳: ${timestamp}`;
};

export const verifySignature = async (address: string, message: string, signature: string): Promise<boolean> => {
  // In a real application, you would verify the signature on the backend
  // For now, we'll just check if the signature exists and is valid format
  if (!signature || !signature.startsWith('0x')) {
    return false;
  }

  // Basic validation - in production, use proper signature verification
  return signature.length === 132; // 0x + 130 hex characters
};

