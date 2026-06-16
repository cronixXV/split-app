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

@Table({ tableName: 'members', timestamps: false })
export class Member extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Room)
  @Column({ type: DataType.UUID, allowNull: false })
  declare roomId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @BelongsTo(() => Room)
  declare room: Room;
}
