// src/componemts/RegisterSubmitButton.jsx
import { Button } from 'antd';
import PropTypes from 'prop-types';

export default function RegisterSubmitButton({ loading }) {
  return (
    <Button
      type="primary"
      htmlType="submit"
      block
      loading={loading}
      data-testid="register-submit-button"
    >
      Create account
    </Button>
  );
}

RegisterSubmitButton.propTypes = {
  loading: PropTypes.bool,
};

RegisterSubmitButton.defaultProps = {
  loading: false,
};
