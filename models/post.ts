import { DataTypes, Model } from 'sequelize';
import { dbType } from '.';
import { sequelize } from './sequelize';

class Post extends Model {
    public readonly id!: number;
    public content!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Post.init({
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Post',
    tableName: 'post',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
    db.Post.belongsTo(db.User);
    db.Post.hasMany(db.Comment);
    db.Post.hasMany(db.Image);
    db.Post.belongsTo(db.Post, { as: 'Retweet'}); // 게시글은 다른 게시글에 리트윗 될 수 있다. 
    db.Post.belongsToMany(db.Hashtag, {through: 'PostHashtag' });
    db.Post.belongsToMany(db.User, {through: 'Like', as: 'Likers' }); // 좋아요를 누른 사용자와의 관계
}

export default Post;