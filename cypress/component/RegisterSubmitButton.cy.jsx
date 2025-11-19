// cypress/component/RegisterSubmitButton.cy.jsx
/* eslint-disable no-undef */

import { mount } from 'cypress/react';

import RegisterSubmitButton from '../../src/componemts/RegisterSubmitButton';

/**
 * Component tests for <RegisterSubmitButton />
 *
 * Goals:
 * - Ensure the button renders with the correct label and submit type
 * - Ensure the loading state is reflected in the DOM
 * - Ensure it can be used as a submit button inside a form
 */
describe('RegisterSubmitButton component', () => {
  it('renders with correct text and submit type by default', () => {
    // Mount the component with default props
    mount(<RegisterSubmitButton />);

    // Find the button via data-testid and assert it exists and has correct text
    cy.get('[data-testid="register-submit-button"]')
      .should('exist')
      .and('have.text', 'Create account');

    // antd Button should ultimately render a <button type="submit">
    cy.get('button[type="submit"]').should('exist');
  });

  it('shows loading state when loading=true', () => {
    // Mount the component in loading state
    mount(<RegisterSubmitButton loading />);

    // Button should still be present in the DOM
    cy.get('[data-testid="register-submit-button"]').should('exist');

    // antd Button adds the 'ant-btn-loading' class when loading is true
    cy.get('button').should('have.class', 'ant-btn-loading');
  });

  it('can submit a form when clicked', () => {
    // Stub to track submit handler calls
    const onSubmit = cy.stub().as('onSubmit');

    // Mount the button inside a form so clicking it triggers submit
    mount(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <RegisterSubmitButton />
      </form>
    );

    // Click the button to trigger the submit event
    cy.get('[data-testid="register-submit-button"]').click();

    // Ensure the submit handler was called exactly once
    cy.get('@onSubmit').should('have.been.calledOnce');
  });
});
