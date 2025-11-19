// src/componemts/BookingConfirmButton.jsx
import { Button } from 'antd';
import PropTypes from 'prop-types';

export default function BookingConfirmButton({ disabled, onClick }) {
  return (
    <Button
      type="primary"
      onClick={onClick}
      disabled={disabled}
      data-testid="booking-confirm-button"
    >
      Confirm booking
    </Button>
  );
}

BookingConfirmButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

BookingConfirmButton.defaultProps = {
  disabled: false,
  onClick: () => {},
};
