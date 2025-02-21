import React, { useState } from 'react';
import { Button, Form, Input, Toast } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import { register, login } from '../utils/auth';
import './Auth.css';

interface AuthProps {
    onAuthSuccess: (token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [visible, setVisible] = useState(false);
    
    const onFinish = async (values: any) => {
        try {
            const response = isLogin
                ? await login(values)
                : await register(values);
            
            Toast.show({
                content: response.message,
                icon: 'success',
            });
            
            onAuthSuccess(response.token);
        } catch (error: any) {
            Toast.show({
                content: error.message,
                icon: 'fail',
            });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{isLogin ? '登录' : '注册'}</h2>
                <Form
                    layout='vertical'
                    onFinish={onFinish}
                    footer={
                        <Button block type='submit' color='primary' size='large'>
                            {isLogin ? '登录' : '注册'}
                        </Button>
                    }
                >
                    <Form.Item
                        name='username'
                        label='用户名'
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input placeholder='请输入用户名' />
                    </Form.Item>

                    {!isLogin && (
                        <Form.Item
                            name='email'
                            label='邮箱'
                            rules={[
                                { required: true, message: '请输入邮箱' },
                                { type: 'email', message: '请输入有效的邮箱地址' }
                            ]}
                        >
                            <Input placeholder='请输入邮箱' />
                        </Form.Item>
                    )}

                    <Form.Item
                        name='password'
                        label='密码'
                        rules={[{ required: true, message: '请输入密码' }]}
                        extra={
                            <div className="eye-button" onClick={() => setVisible(!visible)}>
                                {visible ? <EyeOutline /> : <EyeInvisibleOutline />}
                            </div>
                        }
                    >
                        <Input
                            placeholder='请输入密码'
                            type={visible ? 'text' : 'password'}
                        />
                    </Form.Item>
                </Form>

                <div className="auth-switch">
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Auth;
