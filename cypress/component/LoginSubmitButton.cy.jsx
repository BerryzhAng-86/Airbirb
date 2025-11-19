// cypress/component/LoginSubmitButton.cy.jsx
/* eslint-disable no-undef */

// If your setup uses @cypress/react instead, change this import to:
// import { mount } from '@cypress/react';
import { mount } from 'cypress/react';

import LoginSubmitButton from '../../src/componemts/LoginSubmitButton';

/**
 * Component tests for <LoginSubmitButton />
 *
 * Goals:
 * - Ensure the button renders with correct text and type
 * - Ensure the loading state is reflected in the DOM
 * - Ensure it works correctly as a submit button inside a form
 */
describe('LoginSubmitButton component', () => {
  it('renders with correct text and submit type by default', () => {
    // Mount the component with default props
    mount(<LoginSubmitButton />);

    // Use data-testid to locate the button and assert its text
    cy.get('[data-testid="login-submit-button"]')
      .should('exist')
      .and('have.text', 'Log in');

    // antd Button should ultimately render a <button type="submit"> element
    cy.get('button[type="submit"]').should('exist');
  });

  it('shows loading state when loading=true', () => {
    // Mount the button in loading state
    mount(<LoginSubmitButton loading />);

    // The button should still be present
    cy.get('[data-testid="login-submit-button"]').should('exist');

    // antd Button adds the 'ant-btn-loading' class when loading is true
    cy.get('button').should('have.class', 'ant-btn-loading');
  });

  it('can be used as a submit button inside a form', () => {
    // Stub to track form submit handler calls
    const onSubmit = cy.stub().as('onSubmit');

    // Mount the button inside a <form>, so clicking it triggers submit
    mount(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <LoginSubmitButton />
      </form>
    );

    // Click the button to trigger form submission
    cy.get('[data-testid="login-submit-button"]').click();

    // Verify that the submit handler was called exactly once
    cy.get('@onSubmit').should('have.been.calledOnce');
  });
});
