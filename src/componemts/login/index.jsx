import { useState } from 'react';
import { Form, Input, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { api } from '../../uitles/api';
import { showError } from '../../componemts/showError/index';
import { useNavigate } from 'react-router-dom';
import LoginSubmitButton from '../../componemts/LoginSubmitButton';

/**
 * LoginForm
 *
 * Handles user authentication:
 * - calls the /user/auth/login endpoint
 * - stores token + email in localStorage
 * - broadcasts an "auth-changed" event so other components can react
 * - redirects to the landing page on success
 */
export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await api.login(values.email, values.password);
      const token = data?.token;

      if (token) {
        localStorage.setItem('token', token);
      }
      localStorage.setItem('userEmail', values.email);

      // Notify the rest of the app (including the current tab) that auth state changed
      window.dispatchEvent(new Event('auth-changed'));

      message.success('Logged in successfully');

      // Redirect to the home page after a successful login
      navigate('/');
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="login"
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
    >
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
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
      </Form.Item>

      <Form.Item>
        <LoginSubmitButton loading={loading} />
      </Form.Item>
    </Form>
  );
}
