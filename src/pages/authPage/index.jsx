import { Card, Tabs, Typography, Divider } from 'antd';
import LoginForm from '../../componemts/login/index';
import RegisterForm from '../../componemts/regist/index';
import { Conatiner } from '../../uitles/authPageCss';

const { Title, Text } = Typography;

/**
 * AuthPage
 *
 * Authentication screen with two tabs:
 * - Login: existing users sign in
 * - Register: new users create an account
 *
 * Wrapped in a centered container with a Card layout.
 */
export default function AuthPage() {
  return (
    // Outer layout container (handles centering, background, etc.)
    <Conatiner>
      {/* Main card with title, description, and tabs */}
      <Card style={{ width: '100%', maxWidth: 420 }}>
        {/* App title */}
        <Title level={3} style={{ marginBottom: 4 }}>
          AirBrB
        </Title>

        {/* Short subtitle / helper text */}
        <Text type="secondary">
          Welcome! Please log in or create an account.
        </Text>

        <Divider />

        {/* Tabs: switch between Login and Register forms */}
        <Tabs
          defaultActiveKey="login"
          items={[
            {
              key: 'login',
              label: 'Login',
              children: <LoginForm />,
            },
            {
              key: 'register',
              label: 'Register',
              children: <RegisterForm />,
            },
          ]}
        />
      </Card>
    </Conatiner>
  );
}
