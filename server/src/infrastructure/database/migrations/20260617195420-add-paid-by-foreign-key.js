'use strict';

const CONSTRAINT_NAME = 'expenses_paid_by_member_fk';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('expenses', {
      fields: ['paidBy'],
      type: 'foreign key',
      name: CONSTRAINT_NAME,
      references: {
        table: 'members',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('expenses', CONSTRAINT_NAME);
  },
};
