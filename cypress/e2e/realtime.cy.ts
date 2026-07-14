describe('Real-time синхронизация', () => {
  it('расход появляется в другой вкладке', () => {
    const roomName = `Realtime room ${Date.now()}`;

    cy.createRoomViaUi(roomName);
    cy.addMemberViaUi('Аня');
    cy.addMemberViaUi('Боря');

    cy.url().then(roomUrl => {
      cy.window().then(win => {
        win.open(roomUrl, '_blank');
      });

      cy.addExpenseViaUi({
        description: 'Realtime тест',
        amount: 200,
        payerName: 'Аня',
        expectedSplitCount: 2,
      });

      cy.contains('[data-cy="expense-description"]', 'Realtime тест').should(
        'be.visible'
      );
    });
  });
});
