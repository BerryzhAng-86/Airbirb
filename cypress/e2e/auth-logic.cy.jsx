/* eslint-disable no-undef */
/**
 * Happy Path Test
 *
 * 1 - Visit the register page
 * 2 - Register a host user
 * 3 - After successful registration, redirect to login page and log in
 * 4 - Host creates / edits / publishes / unpublishes a listing
 * 5 - Host logs out
 * 6 - Guest registers and logs in
 * 7 - Guest makes a booking
 * 8 - Guest logs out and logs back in again
 */

// Use Date.now() so repeated runs won't fail because of duplicate emails
const GUEST_EMAIL = `guest_${Date.now()}@example.com`;
const GUEST_PASSWORD = '123456';
const GUEST_NAME = 'guest-user';

describe('presto auth happy path', () => {
  // Before each test we need to restore local storage to preserve it.
  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  // After each test we save local storage.
  afterEach(() => {
    cy.saveLocalStorage();
  });

  // Step 0 =====> Visit the register page
  it('Step0: should navigate to register page successfully', () => {
    // NOTE: Make sure both frontend and backend are running when you run this test
    cy.visit('http://localhost:3000/register');

    // After visiting, the URL should contain /register
    cy.url().should('include', '/register');

    // Check that the register page is rendered:
    // there is a text "Create a new account to get started."
    cy.contains('span', 'Create a new account to get started.')
      .should('be.visible');

    // There should also be a button with label "Create account"
    cy.contains('span', 'Create account')
      .should('be.visible');
  });

  // Step 1 =====> Fill the form and register a host user
  it('Step1: should register a new host user successfully', () => {
    cy.visit('http://localhost:3000/register');
    cy.url().should('include', 'localhost:3000/register');

    // Confirm the register page text again
    cy.contains('span', 'Create a new account to get started.')
      .should('be.visible');
    cy.contains('span', 'Create account')
      .should('be.visible');

    // Fill in the registration form (host user)
    cy.get('input#register_email').focus().type('zhouhai@163.com');
    cy.get('input#register_name').focus().type('zhou');
    cy.get('input#register_password').focus().type('123456');
    cy.get('input#register_confirm').focus().type('123456');

    // Click the submit button
    cy.get('button').click();

    // After successful registration, antd shows a message:
    // "Registered successfully, please log in"
    cy.get('.ant-message')
      .should('have.text', 'Registered successfully, please log in');

    // Then the page should redirect to /login
    cy.url().should('include', 'localhost:3000/login');
  });

  // Step 2 =====> Login as host and go to dashboard (home)
  it('Step2: login as host should navigate to dashboard successfully', () => {
    cy.visit('http://localhost:3000/login');
    cy.url().should('include', 'localhost:3000/login');

    cy.get('input#login_email').focus().type('zhouhai@163.com');
    cy.get('input#login_password').focus().type('123456');
    cy.get('button').click();

    // After login, user should be redirected to / (dashboard / listing page)
    cy.url().should('include', 'localhost:3000/');
  });

  // Step 3 =====> Click "My Listings" to create a new listing
  it('Step3: click My Listings to create a new listing', () => {
    cy.visit('http://localhost:3000/hosted');
    cy.url().should('include', 'localhost:3000/hosted');

    // 1. My Listings page is rendered
    cy.contains('My Listings').should('be.visible');

    // 2. Click "New Listing" button, should navigate to /hosted/new
    cy.contains('button', 'New Listing').click();
    cy.url().should('include', '/hosted/new');

    // 3. Create Listing page is rendered
    cy.contains('Create Listing').should('be.visible');

    // Use a unique title for this test listing to avoid collisions
    const title = `Cypress E2E Listing ${Date.now()}`;

    // ====== Fill ListingForm (all using id attributes) ======

    // Title -> name="title" ⇒ id="title"
    cy.get('input#title')
      .clear()
      .type(title);

    // City -> name={['address','city']} ⇒ id="address_city"
    cy.get('input#address_city')
      .clear()
      .type('Sydney');

    // Price per night (AUD) -> name="price" ⇒ id="price"
    cy.get('input#price')
      .clear()
      .type('150');

    // Type (Select: name={['metadata','type']} ⇒ id="metadata_type")
    cy.get('#metadata_type') // Antd Select wrapper with this id
      .click();
    cy.get('.ant-select-item-option-content')
      .contains('Entire place')
      .click();

    // Bedrooms -> name={['metadata','bedrooms']} ⇒ id="metadata_bedrooms"
    cy.get('input#metadata_bedrooms')
      .clear()
      .type('1');

    // Beds -> name={['metadata','beds']} ⇒ id="metadata_beds"
    cy.get('input#metadata_beds')
      .clear()
      .type('1');

    // Bathrooms -> name={['metadata','bathrooms']} ⇒ id="metadata_bathrooms"
    cy.get('input#metadata_bathrooms')
      .clear()
      .type('1');

    // Amenities can be left empty (not required), DEFAULT_COVER_URL will be used as fallback

    // 4. Click "Save" to submit the form
    cy.contains('button', 'Save').click();

    // 5. Should see "Saved" success message & redirect back to /hosted
    cy.contains('Saved', { timeout: 10000 }).should('be.visible');
    cy.url().should('include', '/hosted');

    // 6. The new listing title should appear in My Listings list
    cy.contains(title).should('be.visible');
  });

  // Step 4 =====> Update listing title and thumbnail successfully
  it('Step4: should update listing title and thumbnail successfully', () => {
    // Rely on preserved login state and go directly to /hosted
    cy.visit('http://localhost:3000/hosted');
    cy.url().should('include', 'localhost:3000/hosted');

    cy.contains('My Listings').should('be.visible');

    // 1. Click "Edit" button on one listing
    //    Assume HostedListSection renders an "Edit" button on each card
    cy.contains('button', 'Edit').first().click();

    // 2. Should navigate to /hosted/:id/edit
    cy.url().should('match', /\/hosted\/\d+\/edit/);
    cy.contains('Edit Listing').should('be.visible');

    // Use a new unique title for easier assertions
    const newTitle = `Cypress Updated Listing ${Date.now()}`;
    const newThumb = 'https://example.com/cypress-updated-cover.png';

    // 3. Update Title
    cy.get('input#title')
      .clear()
      .type(newTitle);

    // 4. Update Thumbnail
    // ListingForm has a hidden thumbnail field:
    // <Form.Item name="thumbnail" hidden><Input /></Form.Item>
    // id => "thumbnail"; use { force: true } in case it's hidden
    cy.get('input#thumbnail')
      .clear({ force: true })
      .type(newThumb, { force: true });

    // 5. Click "Save" to submit changes
    cy.contains('button', 'Save').click();

    // 6. Should see "Saved" success message & redirect back to /hosted
    cy.contains('Saved', { timeout: 10000 }).should('be.visible');
    cy.url().should('include', '/hosted');

    // 7. In My Listings, the updated title should be visible
    cy.contains(newTitle).should('be.visible');

    // (Optional) If cards show cover images, we could assert img.src here
  });

  // Step 5 =====> Publish a listing successfully
  it('Step5: should publish a listing successfully', () => {
    cy.visit('http://localhost:3000/hosted');
    cy.url().should('include', 'localhost:3000/hosted');

    cy.contains('My Listings').should('be.visible');

    // 1. Click "Publish" on the first listing (currently Draft)
    cy.contains('button', 'Publish').first().click();

    // 2. Publish listing modal should appear
    cy.contains('Publish listing').should('be.visible');

    // 3. In the modal, type start/end dates directly into RangePicker inputs
    cy.get('.ant-modal-content').within(() => {
      // Start date
      cy.get('input[placeholder="Start date"]')
        .clear()
        .type('2026-01-10{enter}');

      // End date
      cy.get('input[placeholder="End date"]')
        .clear()
        .type('2026-01-15{enter}');

      // 4. Click "Add" to add this range into pubRanges
      cy.contains('button', 'Add').click();

      // 5. Confirm that an "Added ranges" tag is rendered
      cy.contains('Added ranges:').should('be.visible');
      cy.get('.ant-tag')
        .should('have.length.at.least', 1);

      // 6. Click OK (modal confirm button) to publish
      cy.contains('button', 'OK').click();
    });

    // 7. "Published" success message should appear
    cy.contains('Published', { timeout: 10000 }).should('be.visible');

    // 8. The listing should now show an "Unpublish" button
    cy.contains('button', 'Unpublish').first().should('be.visible');

    // (Optional) Check for green "Published" tag on the card
    cy.get('.ant-card')
      .contains('Published')
      .should('be.visible');
  });

  // Step 6 =====> Unpublish a listing successfully
  it('Step6: should unpublish a listing successfully', () => {
    // Use existing login state and go to /hosted
    cy.visit('http://localhost:3000/hosted');
    cy.url().should('include', 'localhost:3000/hosted');

    cy.contains('My Listings').should('be.visible');

    // 1. Ensure there is at least one published listing (has "Unpublish" button)
    cy.contains('button', 'Unpublish')
      .first()
      .should('be.visible')
      .click();

    // 2. "Unpublished" success message should appear
    cy.contains('Unpublished', { timeout: 10000 }).should('be.visible');

    // 3. Listing should go back to "Draft" state and have a "Publish" button again
    cy.contains('button', 'Publish').should('be.visible');

    cy.get('.ant-card')
      .contains('Draft')
      .should('be.visible');
  });

  // Step 7 =====> Publish again, to make the listing bookable
  it('Step7: should publish a listing for booking', () => {
    cy.visit('http://localhost:3000/hosted');
    cy.url().should('include', 'localhost:3000/hosted');

    cy.contains('My Listings').should('be.visible');

    // 1. Click "Publish" on the first Draft listing
    cy.contains('button', 'Publish').first().click();

    // 2. Publish listing modal should appear
    cy.contains('Publish listing').should('be.visible');

    // 3. Enter start/end date range in the modal
    cy.get('.ant-modal-content').within(() => {
      cy.get('input[placeholder="Start date"]')
        .clear()
        .type('2026-01-10{enter}');

      cy.get('input[placeholder="End date"]')
        .clear()
        .type('2026-01-15{enter}');

      cy.contains('button', 'Add').click();

      cy.contains('Added ranges:').should('be.visible');
      cy.get('.ant-tag')
        .should('have.length.at.least', 1);

      cy.contains('button', 'OK').click();
    });

    cy.contains('Published', { timeout: 10000 }).should('be.visible');

    cy.contains('button', 'Unpublish').first().should('be.visible');

    cy.get('.ant-card')
      .contains('Published')
      .should('be.visible');
  });

  // Step 8 =====> Logout host, register a guest user, and log in as guest
  it('Step8: should logout host and login as a new guest user for booking', () => {
    // 1. Confirm we are logged in as host and on /hosted
    cy.visit('http://localhost:3000/hosted');
    cy.url().should('include', 'localhost:3000/hosted');
    cy.contains('My Listings').should('be.visible');

    // 2. Click "Logout" / "Log out" in navbar (case and spacing flexible)
    cy.contains(/log ?out/i).click();

    // 3. After logout, should be redirected to /login
    cy.url().should('include', '/login');

    // 4. Navigate to /register to create a guest account
    cy.visit('http://localhost:3000/register');
    cy.url().should('include', '/register');

    cy.contains('span', 'Create a new account to get started.')
      .should('be.visible');

    cy.contains('span', 'Create account')
      .should('be.visible');

    // Fill in guest registration form (using GUEST_* constants)
    cy.get('input#register_email').clear().type(GUEST_EMAIL);
    cy.get('input#register_name').clear().type(GUEST_NAME);
    cy.get('input#register_password').clear().type(GUEST_PASSWORD);
    cy.get('input#register_confirm').clear().type(GUEST_PASSWORD);

    cy.get('button').click();

    // Successful registration message
    cy.get('.ant-message')
      .should('have.text', 'Registered successfully, please log in');

    // After successful registration, should redirect back to /login
    cy.url().should('include', '/login');

    // 5. Log in as the new guest user
    cy.get('input#login_email').clear().type(GUEST_EMAIL);
    cy.get('input#login_password').clear().type(GUEST_PASSWORD);
    cy.get('button').click();

    // After login, should redirect to homepage (/) with public listings
    cy.url().should('include', 'localhost:3000/');
  });

  // Step 9 =====> Make a booking as guest
  it('Step9: should make a booking successfully as guest', () => {
    // Ensure we are on the public listings page as guest
    cy.visit('http://localhost:3000/');
    cy.url().should('include', 'localhost:3000/');

    cy.contains('Listings').should('be.visible');

    // 1. Open a listing detail page (card marked with data-cy="listing-card")
    cy.get('[data-cy="listing-card"]').first().click();

    // 2. Confirm we are on /listing/:id
    cy.url({ timeout: 20000 }).should('include', '/listing/');
    cy.contains('Book this place').should('be.visible');

    // 3. Inside the "Book this place" card, click the RangePicker start input
    cy.contains('Book this place')
      .closest('.ant-card')
      .within(() => {
        cy.get('.ant-picker-range input[date-range="start"]').click();
      });

    // 4. Now globally, pick the first two available days in the visible calendar
    cy.get(
      '.ant-picker-dropdown ' +
      '.ant-picker-cell-in-view:not(.ant-picker-cell-disabled) ' +
      '.ant-picker-cell-inner',
      { timeout: 10000 } // Give the calendar time to appear
    )
      .eq(0)
      .click();

    cy.get(
      '.ant-picker-dropdown ' +
      '.ant-picker-cell-in-view:not(.ant-picker-cell-disabled) ' +
      '.ant-picker-cell-inner'
    )
      .eq(1)
      .click();

    // 5. Back in the booking card: set guest count and click "Confirm booking"
    cy.contains('Book this place')
      .closest('.ant-card')
      .within(() => {
        // Guest count InputNumber
        cy.get('.ant-input-number-input')
          .clear()
          .type('2');

        // Confirm booking
        cy.contains('button', 'Confirm booking').click();
      });

    // 6. Success message for booking request
    cy.contains('Booking requested', { timeout: 10000 }).should('be.visible');

    // 7. "Your bookings for this listing:" section should appear
    cy.contains('Your bookings for this listing:').should('be.visible');
  });

  // Step 10 =====> Logout as guest successfully
  it('Step10: should logout guest successfully', () => {
    // Visit homepage and confirm we are still logged in
    cy.visit('http://localhost:3000/');
    cy.url().should('include', 'localhost:3000/');

    cy.contains('Listings').should('be.visible');

    // 1. Click "Logout" / "Log out" in navbar (flexible matching)
    cy.contains(/log ?out/i).click();

    // 2. After logout, user should be redirected to /login
    cy.url().should('include', '/login');
  });

  // Step 11 =====> Log back in as guest successfully
  it('Step11: should login as guest again successfully', () => {
    // 1. Visit login page
    cy.visit('http://localhost:3000/login');
    cy.url().should('include', '/login');

    // 2. Use the same GUEST_EMAIL / GUEST_PASSWORD registered in Step8
    cy.get('input#login_email').clear().type(GUEST_EMAIL);
    cy.get('input#login_password').clear().type(GUEST_PASSWORD);
    cy.get('button').click();

    // 3. After login, should land back on homepage (Listings)
    cy.url().should('include', 'localhost:3000/');
    cy.contains('Listings').should('be.visible');
  });
});
