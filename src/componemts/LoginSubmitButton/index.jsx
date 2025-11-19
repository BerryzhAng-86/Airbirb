// src/componemts/LoginSubmitButton.jsx
import { Button } from 'antd';
import PropTypes from 'prop-types';

export default function LoginSubmitButton({ loading }) {
  return (
    <Button
      type="primary"
      htmlType="submit"
      block
      loading={loading}
      data-testid="login-submit-button"
    >
      Log in
    </Button>
  );
}

LoginSubmitButton.propTypes = {
  loading: PropTypes.bool,
};

LoginSubmitButton.defaultProps = {
  loading: false,
};
