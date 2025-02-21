import { AuthResponse, LoginForm, RegisterForm, User, ProfileUpdateForm } from '../types/user';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const register = async (data: RegisterForm): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '注册失败');
    }

    return response.json();
};

export const login = async (data: LoginForm): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '登录失败');
    }

    return response.json();
};

export const getCurrentUser = async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('获取用户信息失败');
    }

    const data = await response.json();
    return data.user;
};

export const updateProfile = async (data: ProfileUpdateForm): Promise<User> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '更新个人信息失败');
    }

    const result = await response.json();
    return result.user;
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword }),
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '修改密码失败');
    }
};

export const setToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const removeToken = () => {
    localStorage.removeItem('token');
};
