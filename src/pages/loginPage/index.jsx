// src/pages/loginPage/index.jsx
import { Card, Typography, Divider } from 'antd';
import { Link } from 'react-router-dom';
import LoginForm from '../../componemts/login';
import { Conatiner } from '../../uitles/authPageCss';

const { Title, Text } = Typography;

// login
export default function LoginPage() {
  return (
    <Conatiner>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          AirBrB
        </Title>
        <Text type="secondary">Welcome back, please log in.</Text>

        <Divider />

        <LoginForm />

        <Divider />

        <Text type="secondary">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </Text>
      </Card>
    </Conatiner>
  );
}
