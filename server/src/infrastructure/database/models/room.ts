import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import { Member } from './member';
import { Expense } from './expense';

@Table({ tableName: 'rooms', timestamps: true })
export class Room extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @HasMany(() => Member)
  declare members: Member[];

  @HasMany(() => Expense)
  declare expenses: Expense[];
}
