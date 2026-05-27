import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface IProduct {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  sku: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Product extends Model<IProduct> implements IProduct {
  public id!: string;
  public name!: string;
  public description!: string;
  public price!: number;
  public quantity!: number;
  public sku!: string;
  public userId!: string;
  public createdAt?: Date;
  public updatedAt?: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true
  }
);

// Define associations
Product.belongsTo(User, { foreignKey: 'userId', as: 'creator' });
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });

export default Product;
