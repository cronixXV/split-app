import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import { Room } from './room';

@Table({ tableName: 'expenses', timestamps: true })
export class Expense extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Room)
  @Column({ type: DataType.UUID, allowNull: false })
  declare roomId: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare paidBy: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amount: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare description: string;

  @Column({ type: DataType.ARRAY(DataType.UUID), allowNull: false })
  declare split: string[];

  @BelongsTo(() => Room)
  declare room: Room;
}
