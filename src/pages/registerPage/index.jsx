// src/pages/registerPage/index.jsx
import { Card, Typography, Divider } from 'antd';
import { Link } from 'react-router-dom';
import RegisterForm from '../../componemts/regist';
import { Conatiner } from '../../uitles/authPageCss';

const { Title, Text } = Typography;

// register page
export default function RegisterPage() {
  return (
    <Conatiner>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          AirBrB
        </Title>
        <Text type="secondary">Create a new account to get started.</Text>

        <Divider />

        <RegisterForm />

        <Divider />

        <Text type="secondary">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </Text>
      </Card>
    </Conatiner>
  );
}
