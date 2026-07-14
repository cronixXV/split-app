function assertMoney(selector: string, expectedAmount: number): void {
  cy.get(selector)
    .invoke('text')
    .then(text => {
      const normalizedText = text.replace(/\u00a0/g, ' ').trim();

      expect(normalizedText).to.match(
        new RegExp(`${expectedAmount}(?:[,.]00)?\\s*₽`)
      );
    });
}

describe('Расходы и переводы', () => {
  beforeEach(() => {
    const roomName = `Expenses room ${Date.now()}`;

    cy.createRoomViaUi(roomName);

    cy.addMemberViaUi('Алиса');
    cy.addMemberViaUi('Борис');
  });

  it('создаёт расход и рассчитывает перевод', () => {
    const description = 'Ужин';

    cy.addExpenseViaUi({
      description,
      amount: 100,
      payerName: 'Алиса',
      expectedSplitCount: 2,
    });

    cy.get('[data-cy="expense-item"]')
      .should('have.length', 1)
      .first()
      .within(() => {
        cy.get('[data-cy="expense-description"]').should(
          'have.text',
          description
        );

        cy.get('[data-cy="expense-payer"]').should('contain.text', 'Алиса');

        cy.get('[data-cy="expense-split-count"]').should('contain.text', '2');

        assertMoney('[data-cy="expense-amount"]', 100);
      });

    cy.get('[data-cy="transfer-item"]')
      .should('have.length', 1)
      .first()
      .within(() => {
        cy.get('[data-cy="transfer-route"]').should(
          'contain.text',
          'Борис → Алиса'
        );

        assertMoney('[data-cy="transfer-amount"]', 50);
      });
  });

  it('сохраняет расход и перевод после перезагрузки', () => {
    const description = 'Продукты';

    cy.addExpenseViaUi({
      description,
      amount: 100,
      payerName: 'Алиса',
      expectedSplitCount: 2,
    });

    cy.reload();

    cy.contains('[data-cy="expense-description"]', description).should(
      'be.visible'
    );

    cy.get('[data-cy="expense-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="expense-payer"]').should('contain.text', 'Алиса');

        cy.get('[data-cy="expense-split-count"]').should('contain.text', '2');

        assertMoney('[data-cy="expense-amount"]', 100);
      });

    cy.get('[data-cy="transfer-item"]')
      .should('have.length', 1)
      .first()
      .within(() => {
        cy.get('[data-cy="transfer-route"]').should(
          'contain.text',
          'Борис → Алиса'
        );

        assertMoney('[data-cy="transfer-amount"]', 50);
      });
  });
});
