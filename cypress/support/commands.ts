interface IAddExpenseViaUiOptions {
  description: string;
  amount: number;
  payerName: string;
  expectedSplitCount: number;
}

declare global {
  namespace Cypress {
    interface Chainable {
      createRoomViaUi(roomName: string): Chainable<string>;

      addMemberViaUi(memberName: string): Chainable<JQuery<HTMLElement>>;

      addExpenseViaUi(
        options: IAddExpenseViaUiOptions
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('createRoomViaUi', (roomName: string) => {
  const alias = Cypress._.uniqueId('createRoom');

  cy.intercept({
    method: 'POST',
    pathname: '/api/rooms',
    times: 1,
  }).as(alias);

  cy.visit('/');

  cy.get('[data-cy="room-name-input"]')
    .should('be.visible')
    .and('be.enabled')
    .clear()
    .type(roomName);

  cy.get('[data-cy="create-room-submit"]')
    .should('be.visible')
    .and('be.enabled')
    .click();

  return cy.wait(`@${alias}`).then(interception => {
    expect(interception.response?.statusCode).to.eq(201);

    const responseBody = interception.response?.body as {
      id?: unknown;
      name?: unknown;
    };

    expect(responseBody.name).to.eq(roomName);

    expect(responseBody.id).to.be.a('string');

    if (typeof responseBody.id !== 'string') {
      throw new Error('Create room response does not contain room id');
    }

    const roomId = responseBody.id;

    expect(roomId).to.match(/^[0-9a-f-]{36}$/);

    return cy
      .location('pathname')
      .should('eq', `/rooms/${roomId}`)
      .then(() => roomId);
  });
});

Cypress.Commands.add('addMemberViaUi', (memberName: string) => {
  const alias = Cypress._.uniqueId('addMember');

  cy.intercept({
    method: 'POST',
    url: '**/api/rooms/*/members',
    times: 1,
  }).as(alias);

  cy.get('[data-cy="member-name-input"]')
    .should('be.visible')
    .and('be.enabled')
    .clear()
    .type(memberName);

  cy.get('[data-cy="add-member-submit"]')
    .should('be.visible')
    .and('be.enabled')
    .click();

  cy.wait(`@${alias}`).then(interception => {
    expect(interception.response?.statusCode).to.eq(201);

    const responseBody = interception.response?.body as {
      id?: unknown;
      name?: unknown;
    };

    expect(responseBody.id).to.be.a('string');

    expect(responseBody.name).to.eq(memberName);
  });

  return cy
    .contains('[data-cy="member-item"]', memberName)
    .should('be.visible');
});

Cypress.Commands.add(
  'addExpenseViaUi',
  ({
    description,
    amount,
    payerName,
    expectedSplitCount,
  }: IAddExpenseViaUiOptions) => {
    const alias = Cypress._.uniqueId('addExpense');

    cy.intercept({
      method: 'POST',
      url: '**/api/rooms/*/expenses',
      times: 1,
    }).as(alias);

    cy.get('[data-cy="expense-description-input"]')
      .should('be.visible')
      .and('be.enabled')
      .clear()
      .type(description);

    cy.get('[data-cy="expense-amount-input"]')
      .should('be.visible')
      .and('be.enabled')
      .clear()
      .type(String(amount));

    cy.get('[data-cy="expense-payer-trigger"]')
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.contains('[data-cy="expense-payer-option"]', payerName)
      .should('be.visible')
      .click();

    cy.get('[data-cy="add-expense-submit"]')
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.wait(`@${alias}`).then(interception => {
      expect(interception.response?.statusCode).to.eq(201);

      const requestBody = interception.request.body as {
        description?: unknown;
        amount?: unknown;
        paidBy?: unknown;
        split?: unknown;
      };

      expect(requestBody.description).to.eq(description);

      expect(Number(requestBody.amount)).to.eq(amount);

      expect(requestBody.paidBy).to.be.a('string');

      expect(requestBody.paidBy).not.to.equal('');

      expect(requestBody.split)
        .to.be.an('array')
        .and.have.length(expectedSplitCount);
    });

    return cy
      .contains('[data-cy="expense-description"]', description)
      .closest('[data-cy="expense-item"]')
      .should('be.visible');
  }
);

export {};
