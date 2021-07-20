
import {
    BelongsToManyAddAssociationMixin,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManyGetAssociationsMixin, 
    HasManyGetAssociationsMixin, 
    DataTypes, 
    Model 
} from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';
import Post from './post';

class User extends Model {
    public readonly id!: number;
    public nickname!: string;
    public userId!: string;
    public password!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly Posts?: Post[];
    public readonly Followings?: User[];
    public readonly Followers?: User[];

    public addFollowing!: BelongsToManyAddAssociationMixin<User, number>
    public getFollowings!: BelongsToManyGetAssociationsMixin<User>;
    public removeFollowing!: BelongsToManyRemoveAssociationMixin<User, number>;
    public getFollowers!: BelongsToManyGetAssociationsMixin<User>;
    public removeFollower!: BelongsToManyRemoveAssociationMixin<User, number>;
    public getPosts!: HasManyGetAssociationsMixin<Post>;

}

User.init({
    nickname: {
        type: DataTypes.STRING(20),
    },
    userId : {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false,

    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'user',
    charset: 'utf8',
    collate: 'utf8_general_ci',

});

export const associate = (db: dbType) => {
    db.User.hasMany(db.Post, { as: 'Posts' });
    db.User.hasMany(db.Comment);
    db.User.belongsToMany(db.Post, {through: 'Like', as: 'Liked' }); // 사용자가 게시글에 좋아요
    db.User.belongsToMany(db.User, {through: 'Follow', as: 'Followers', foreignKey: 'followingId' });
    db.User.belongsToMany(db.User, {through: 'Follow', as: 'Followings', foreignKey: 'followerId' });

}

export default User;