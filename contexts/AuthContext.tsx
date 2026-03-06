'use client';

import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { fetchAccounts, registerUser, resendVerificationEmail as resendVerificationEmailService, updateUserQuizStats, updateStudyTime, requestPasswordReset as requestPasswordResetService, resetPasswordWithOTP as resetPasswordWithOTPService, updateUsername as updateUsernameService, updatePassword as updatePasswordService, getAccountByEmail } from '@/services/googleSheetService';
import type { Account } from '@/types';
import { useToast } from './ToastContext';

interface LoginResult {
  success: boolean;
  error?: string;
  reason?: 'unverified';
  email?: string;
}

interface AuthContextType {
  currentUser: Account | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<LoginResult>;
  logout: () => void;
  register: (
    username: string,
    email: string,
    pass: string,
    schoolName: string
  ) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPasswordWithOTP: (email: string, otp: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  updateUserStats: (attempted: number, correct: number) => void;
  deductTokensForPractice: () => void;
  isStudying: boolean;
  sessionStartTime: number | null;
  startStudySession: () => void;
  endStudySession: () => Promise<void>;
  updateUsername: (newName: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshCurrentUser: (options?: { silent?: boolean }) => Promise<Account | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStudying, setIsStudying] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const { addToast } = useToast();
  const showToast = addToast; // Map showToast to addToast from ToastContext
  const studyIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      const startTime = sessionStorage.getItem('sessionStartTime');
      if (startTime) {
        setIsStudying(true);
        setSessionStartTime(Number(startTime));
      }
    } catch (error) {
      console.error("Failed to parse from sessionStorage", error);
      sessionStorage.clear();
    } finally {
        setLoading(false);
    }
  }, []);
  
  const saveIncrementalStudyTime = useCallback(async () => {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (!user) return;

    const result = await updateStudyTime(user.Email, 1);
    if (result.success && result.studyTime) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const updatedUser = {
          ...prev,
          'Tổng thời gian học': result.studyTime!.allTime,
          'Thời gian học hôm nay': result.studyTime!.today,
          'Ngày cập nhật học': result.studyTime!.lastUpdateDate,
        };
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } else {
        console.error("Failed to save incremental study time:", result.error);
    }
  }, []);

  useEffect(() => {
    if (isStudying && currentUser) {
        if (studyIntervalRef.current) clearInterval(studyIntervalRef.current);
        studyIntervalRef.current = window.setInterval(saveIncrementalStudyTime, 60 * 1000); // Save every minute
    }
    return () => {
        if (studyIntervalRef.current) {
            clearInterval(studyIntervalRef.current);
            studyIntervalRef.current = null;
        }
    };
  }, [isStudying, currentUser, saveIncrementalStudyTime]);


  const startStudySession = useCallback(() => {
    const startTime = Date.now();
    setIsStudying(true);
    setSessionStartTime(startTime);
    sessionStorage.setItem('sessionStartTime', String(startTime));
    showToast('Bắt đầu phiên học!', 'info');
  }, [showToast]);

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    try {
        const accounts = await fetchAccounts();
        
        // Find user by email, case-insensitively for better UX.
        const normalizedInputEmail = email.trim().toLowerCase();
        const user = accounts.find(
            (acc) => acc.Email && acc.Email.trim().toLowerCase() === normalizedInputEmail
        );

        if (!user) {
            // User not found. Generic error message for security.
            return { success: false, error: 'Email hoặc mật khẩu không đúng.' };
        }

        // Retrieve the stored password.
        const storedPassword = user['Mật khẩu'];

        // Check if the stored password is a valid string.
        if (typeof storedPassword !== 'string' || storedPassword.length === 0) {
            console.error(`Password for user ${email} is missing or invalid.`);
            return { success: false, error: 'Đã xảy ra lỗi với tài khoản của bạn. Vui lòng liên hệ quản trị viên.' };
        }

        // Check verification status first
        if (user['Đã xác minh'] !== 'Có') {
            return {
                success: false,
                reason: 'unverified',
                error: 'Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email.',
                email: user.Email,
            };
        }

        // The correct, standard, and secure way to compare passwords:
        // A direct, case-sensitive comparison without any transformations.
        if (storedPassword === pass) {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            startStudySession(); // Automatically start study session on login
            return { success: true };
        } else {
            // Password does not match. Generic error.
            return { success: false, error: 'Email hoặc mật khẩu không đúng.' };
        }

    } catch (error) {
        console.error('Login failed:', error);
        return { success: false, error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.' };
    }
  };


  const endStudySession = useCallback(async () => {
    if (studyIntervalRef.current) {
        clearInterval(studyIntervalRef.current);
        studyIntervalRef.current = null;
    }

    const startTime = Number(sessionStorage.getItem('sessionStartTime'));
    if (!startTime || !currentUser) return;

    // Calculate remaining duration that hasn't been saved by the interval yet.
    const durationInMinutes = Math.round((Date.now() - startTime) / (1000 * 60));

    // Clear session state immediately for responsiveness
    setIsStudying(false);
    setSessionStartTime(null);
    sessionStorage.removeItem('sessionStartTime');

    if (durationInMinutes > 0) {
        const result = await updateStudyTime(currentUser.Email, durationInMinutes);
        if (result.success && result.studyTime) {
            setCurrentUser(prev => {
                if (!prev) return null;
                const updatedUser = {
                    ...prev,
                    'Tổng thời gian học': result.studyTime!.allTime,
                    'Thời gian học hôm nay': result.studyTime!.today,
                    'Ngày cập nhật học': result.studyTime!.lastUpdateDate,
                };
                sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
                return updatedUser;
            });
            showToast(`Đã ghi nhận ${durationInMinutes} phút học cuối cùng.`, 'success');
        } else {
            showToast('Không thể lưu thời gian học cuối cùng.', 'error');
        }
    } else {
        showToast('Kết thúc phiên học.', 'info');
    }
  }, [currentUser, showToast]);

  const logout = () => {
    endStudySession(); // Save remaining time before clearing user
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
  };

  const register = async (username: string, email: string, pass: string,   schoolName: string) => {
    try {
        const accounts = await fetchAccounts();
        const userExists = accounts.some(acc => acc.Email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            return { success: false, error: 'Email này đã được sử dụng.' };
        }
      
        const response = await registerUser({
            'Tên tài khoản': username,
            Email: email,
            'Mật khẩu': pass,
             schoolName: schoolName
        });

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Đã xảy ra lỗi khi đăng ký.' };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      return await resendVerificationEmailService(email);
    } catch (error) {
      console.error('Resending verification email failed:', error);
      return { success: false, error: 'Đã xảy ra lỗi khi gửi lại email.' };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      return await requestPasswordResetService(email);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPasswordWithOTP = async (email: string, otp: string, newPass: string) => {
    try {
      return await resetPasswordWithOTPService(email, otp, newPass);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateUsername = useCallback(async (newName: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
        return { success: false, error: 'Bạn phải đăng nhập.' };
    }

    const originalUser = { ...currentUser };
    const updatedUser = { ...currentUser, 'Tên tài khoản': newName };

    // Optimistic UI update
    setCurrentUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

    try {
        const result = await updateUsernameService(currentUser.Email, newName);
        if (result.success) {
            showToast('Tên đã được cập nhật thành công!', 'success');
            return { success: true };
        } else {
            // Revert on failure
            setCurrentUser(originalUser);
            sessionStorage.setItem('currentUser', JSON.stringify(originalUser));
            showToast(result.error || 'Cập nhật tên thất bại.', 'error');
            return { success: false, error: result.error };
        }
    } catch (error: any) {
        // Revert on network error
        setCurrentUser(originalUser);
        sessionStorage.setItem('currentUser', JSON.stringify(originalUser));
        showToast(error.message || 'Lỗi mạng, không thể cập nhật tên.', 'error');
        return { success: false, error: error.message };
    }
  }, [currentUser, showToast]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
        return { success: false, error: 'Bạn phải đăng nhập.' };
    }
    
    // Verify current password on client-side first
    if (currentUser['Mật khẩu'] !== currentPassword) {
        showToast('Mật khẩu hiện tại không đúng.', 'error');
        return { success: false, error: 'Mật khẩu hiện tại không đúng.' };
    }

    try {
        const result = await updatePasswordService(currentUser.Email, currentPassword, newPassword);
        if (result.success) {
            // Update password in local state/session storage for future client-side checks within the same session
            const updatedUser = { ...currentUser, 'Mật khẩu': newPassword };
            setCurrentUser(updatedUser);
            sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            showToast('Mật khẩu đã được thay đổi thành công!', 'success');
            return { success: true };
        } else {
            showToast(result.error || 'Đổi mật khẩu thất bại.', 'error');
            return { success: false, error: result.error };
        }
    } catch (error: any) {
        showToast(error.message || 'Lỗi mạng, không thể đổi mật khẩu.', 'error');
        return { success: false, error: error.message };
    }
  }, [currentUser, showToast]);

  const updateUserStats = useCallback(async (attempted: number, correct: number) => {
    const userToUpdate = JSON.parse(sessionStorage.getItem('currentUser') || 'null') as Account | null;

    if (!userToUpdate) return;

    // 1. Optimistic UI update for stats
    const updatedUserForStats: Account = {
        ...userToUpdate,
        'Tổng số câu hỏi đã làm': (userToUpdate['Tổng số câu hỏi đã làm'] || 0) + attempted,
        'Tổng số câu hỏi đã làm đúng': (userToUpdate['Tổng số câu hỏi đã làm đúng'] || 0) + correct,
        'Tổng số câu hỏi đã làm trong tuần': (userToUpdate['Tổng số câu hỏi đã làm trong tuần'] || 0) + attempted,
        'Tổng số câu hỏi đã làm đúng trong tuần': (userToUpdate['Tổng số câu hỏi đã làm đúng trong tuần'] || 0) + correct,
    };
    
    setCurrentUser(updatedUserForStats);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUserForStats));
    
    // 2. Persist stats to backend (fire and forget)
    updateUserQuizStats(userToUpdate.Email, attempted, correct)
        .catch(err => {
             console.error("Error calling updateUserQuizStats service:", err);
        });
  }, [showToast]);

  const deductTokensForPractice = useCallback(() => {
    showToast('Chức năng token đang được bảo trì. Lần luyện tập này miễn phí!', 'info');
    // Temporarily disabled as per user request. No tokens will be deducted.
  }, [showToast]);

  const refreshCurrentUser = useCallback(async (options?: { silent?: boolean }): Promise<Account | null> => {
    const userInSession = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (!userInSession?.Email) {
      return null;
    }
    try {
      const updatedAccount = await getAccountByEmail(userInSession.Email);
      if (updatedAccount) {
        if (!options?.silent) {
            setCurrentUser(updatedAccount);
            sessionStorage.setItem('currentUser', JSON.stringify(updatedAccount));
        }
        return updatedAccount;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh current user:", error);
      return null;
    }
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    logout,
    register,
    resendVerificationEmail,
    requestPasswordReset,
    resetPasswordWithOTP,
    updateUserStats,
    deductTokensForPractice,
    isStudying,
    sessionStartTime,
    startStudySession,
    endStudySession,
    updateUsername,
    updatePassword,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
