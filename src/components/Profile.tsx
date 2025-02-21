import React, { useState } from 'react';
import { Form, Input, Button, Toast, Dialog } from 'antd-mobile';
import { updateProfile, changePassword } from '../utils/auth';
import { User } from '../types/user';
import './Profile.css';

interface ProfileProps {
  user: User;
  onProfileUpdate: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm] = Form.useForm();

  const handleProfileUpdate = async (values: Partial<User>) => {
    try {
      const updatedUser = await updateProfile(values);
      onProfileUpdate(updatedUser);
      Toast.show({
        content: '个人信息更新成功',
        icon: 'success',
      });
      setIsEditing(false);
    } catch (error: any) {
      Toast.show({
        content: error.message || '更新失败',
        icon: 'fail',
      });
    }
  };

  const handlePasswordSubmit = async (values: any) => {
    try {
      if (values.newPassword !== values.confirmPassword) {
        Toast.show({
          content: '两次输入的密码不一致',
          icon: 'fail',
        });
        return;
      }
      await changePassword(values.oldPassword, values.newPassword);
      Toast.show({
        content: '密码修改成功',
        icon: 'success',
      });
      Dialog.clear();
    } catch (error: any) {
      Toast.show({
        content: error.message || '密码修改失败',
        icon: 'fail',
      });
    }
  };

  const handlePasswordChange = () => {
    Dialog.show({
      content: (
        <Form
          form={passwordForm}
          layout='vertical'
          onFinish={handlePasswordSubmit}
        >
          <Form.Item
            name='oldPassword'
            label='当前密码'
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input type='password' placeholder='请输入当前密码' />
          </Form.Item>
          <Form.Item
            name='newPassword'
            label='新密码'
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input type='password' placeholder='请输入新密码' />
          </Form.Item>
          <Form.Item
            name='confirmPassword'
            label='确认新密码'
            rules={[{ required: true, message: '请确认新密码' }]}
          >
            <Input type='password' placeholder='请再次输入新密码' />
          </Form.Item>
          <Button block type='submit' color='primary'>
            确认修改
          </Button>
        </Form>
      ),
      closeOnAction: false,
      actions: [
        {
          key: 'cancel',
          text: '取消',
          onClick: () => {
            passwordForm.resetFields();
            Dialog.clear();
          }
        }
      ]
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>个人信息</h2>
        {!isEditing && (
          <Button
            color='primary'
            fill='none'
            onClick={() => setIsEditing(true)}
          >
            编辑
          </Button>
        )}
      </div>

      <Form
        layout='vertical'
        initialValues={user}
        onFinish={handleProfileUpdate}
        footer={
          isEditing && (
            <div className="form-buttons">
              <Button
                block
                color='default'
                onClick={() => setIsEditing(false)}
              >
                取消
              </Button>
              <Button block type='submit' color='primary'>
                保存
              </Button>
            </div>
          )
        }
      >
        <Form.Item
          name='username'
          label='用户名'
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            placeholder='请输入用户名'
            readOnly={!isEditing}
          />
        </Form.Item>

        <Form.Item
          name='email'
          label='邮箱'
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            placeholder='请输入邮箱'
            readOnly={!isEditing}
          />
        </Form.Item>
      </Form>

      <div className="profile-actions">
        <Button
          block
          color='primary'
          fill='outline'
          onClick={handlePasswordChange}
        >
          修改密码
        </Button>
      </div>
    </div>
  );
};

export default Profile;
