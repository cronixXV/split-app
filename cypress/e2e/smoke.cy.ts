describe('Production smoke test', () => {
  it('открывает главную страницу', () => {
    cy.visit('/');

    cy.get('[data-cy="room-name-input"]').should('be.visible');

    cy.get('[data-cy="create-room-submit"]').should('be.visible');
  });

  it('backend готов принимать запросы', () => {
    cy.request('/ready').then(response => {
      expect(response.status).to.eq(200);

      expect(response.body).to.deep.eq({
        ready: true,
      });
    });
  });
});
