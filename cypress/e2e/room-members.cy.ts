describe('Участники комнаты', () => {
  beforeEach(() => {
    const roomName = `Members room ${Date.now()}`;

    cy.createRoomViaUi(roomName);

    cy.get('[data-cy="members-empty"]').should('be.visible');
  });

  it('добавляет двух участников', () => {
    const firstMember = 'Алиса';
    const secondMember = 'Борис';

    cy.addMemberViaUi(firstMember);
    cy.addMemberViaUi(secondMember);

    cy.get('[data-cy="member-item"]').should('have.length', 2);

    cy.contains('[data-cy="member-item"]', firstMember).should('be.visible');

    cy.contains('[data-cy="member-item"]', secondMember).should('be.visible');

    cy.get('[data-cy="members-empty"]').should('not.exist');
  });

  it('сохраняет участника после перезагрузки страницы', () => {
    const memberName = 'Егор';

    cy.addMemberViaUi(memberName);

    cy.reload();

    cy.contains('[data-cy="member-item"]', memberName).should('be.visible');
  });
});
