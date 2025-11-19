import { useState } from 'react';
import { Form, Input, message } from 'antd';
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { api } from '../../uitles/api';
import { showError } from '../../componemts/showError/index';
import { useNavigate } from 'react-router-dom';
import RegisterSubmitButton from '../../componemts/RegisterSubmitButton';

/**
 * RegisterForm
 *
 * Handles user sign-up:
 * - calls the /user/auth/register endpoint
 * - shows a success message on completion
 * - redirects the user back to the auth page (login form)
 */
export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await api.register(values.email, values.password, values.name);
      message.success('Registered successfully, please log in');
      // After successful registration, go back to the login screen
      navigate('/login');
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="register"
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please enter your name' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Your name" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Please enter your email' },
          { type: 'email', message: 'Invalid email' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="you@example.com" />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: 'Please enter your password' },
          { min: 6, message: 'At least 6 characters' },
        ]}
        hasFeedback
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="At least 6 characters"
        />
      </Form.Item>

      <Form.Item
        label="Confirm Password"
        name="confirm"
        dependencies={['password']}
        hasFeedback
        rules={[
          { required: true, message: 'Please confirm your password' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error('Passwords do not match'),
              );
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Repeat your password"
        />
      </Form.Item>

      <Form.Item>
        <RegisterSubmitButton loading={loading} />
      </Form.Item>
    </Form>
  );
}
