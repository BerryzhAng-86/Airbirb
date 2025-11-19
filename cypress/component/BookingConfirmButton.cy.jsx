// cypress/component/BookingConfirmButton.cy.jsx

/* eslint-disable no-undef */
import { mount } from 'cypress/react';

import BookingConfirmButton from '../../src/componemts/BookingConfirmButton';

/**
 * Component tests for <BookingConfirmButton />
 *
 * Goals:
 * - Verify basic rendering (text + enabled state)
 * - Verify that the `disabled` prop works
 * - Verify that `onClick` is called only when the button is enabled
 */
describe('BookingConfirmButton component', () => {
  it('renders with correct text and is enabled by default', () => {
    // Mount the component with default props
    mount(<BookingConfirmButton />);

    // Should render with the correct text and not be disabled
    cy.get('[data-testid="booking-confirm-button"]')
      .should('exist')
      .and('have.text', 'Confirm booking')
      .and('not.be.disabled');
  });

  it('respects the disabled prop', () => {
    // Mount the component in disabled state
    mount(<BookingConfirmButton disabled />);

    // The button should be disabled in the DOM
    cy.get('[data-testid="booking-confirm-button"]').should('be.disabled');
  });

  it('calls onClick when clicked and not disabled', () => {
    // Create a stub to track click handler calls
    const onClick = cy.stub().as('onClick');

    // Mount with an onClick handler
    mount(<BookingConfirmButton onClick={onClick} />);

    // Click the button
    cy.get('[data-testid="booking-confirm-button"]').click();

    // onClick should be called exactly once
    cy.get('@onClick').should('have.been.calledOnce');
  });

  it('does not call onClick when disabled', () => {
    // Stub for the onClick handler
    const onClick = cy.stub().as('onClick');

    // Mount the button as disabled but still provide onClick
    mount(<BookingConfirmButton disabled onClick={onClick} />);

    // Even if we force the click on a disabled button,
    // the handler should not be executed
    cy.get('[data-testid="booking-confirm-button"]')
      .should('be.disabled')
      .click({ force: true }); // Forcing the click should still not trigger the callback

    // Confirm that the handler was never called
    cy.get('@onClick').should('not.have.been.called');
  });
});
