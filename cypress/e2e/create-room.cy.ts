describe('Создание комнаты', () => {
  it('создаёт комнату и открывает её страницу', () => {
    const roomName = `Cypress room ${Date.now()}`;

    cy.createRoomViaUi(roomName).then(roomId => {
      expect(roomId).to.match(/^[0-9a-f-]{36}$/);
    });

    cy.get('[data-cy="room-title"]')
      .should('be.visible')
      .and('have.text', roomName);
  });

  it('показывает ошибку и не отправляет пустое название', () => {
    cy.intercept({
      method: 'POST',
      pathname: '/api/rooms',
    }).as('createRoom');

    cy.visit('/');

    cy.get('[data-cy="room-name-input"]').should('have.value', '');

    cy.get('[data-cy="create-room-submit"]').click();

    cy.location('pathname').should('eq', '/');

    cy.get('[data-cy="room-name-error"]')
      .should('be.visible')
      .and('not.be.empty');

    cy.get('@createRoom.all').should('have.length', 0);
  });
});
