
import * as express from 'express';
import { isLoggedIn } from './middleware';
import * as multer from 'multer';
import * as multerS3 from 'multer-s3';
import * as AWS from 'aws-sdk';
import * as path from 'path';
import Post from '../models/post';
import Hashtag from '../models/hashtag';
import Image from '../models/image';
import * as BlueBird from 'bluebird';
import User from '../models/user';
import Comment from '../models/comment';

const router = express.Router();

AWS.config.update({
    region: 'ap-northeast-2',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

const upload = multer({
    storage: multerS3({
        s3: new AWS.S3(),
        bucket: 'react-nodebird',
        key(req, file, cb) {
            cb(null, `original\${+new Date()}${path.basename(file.originalname)}`);
        },
    }),
    limits: { fileSize: 20 * 1024 * 1024},
});

router.post('/', isLoggedIn, upload.none(), async(req, res, next) => {
    try {
        const hashtags: string[] = req.body.content.match(/#[^\s]+/g);
        const newPost = await Post.create({
            content: req.body.content,
            UserId: req.user!.id,
        })
        if(hashtags) {
            const promises = hashtags.map((tag) => Hashtag.findOrCreate({
                where: {name: tag.slice(1).toLowerCase() },
            }));
            const result = await Promise.all(promises);
            await newPost.addHashtags(result.map((r) => r[0]));
        }
        if(req.body.image) {
            if(Array.isArray(req.body.image)) {
                const promises: BlueBird<Image>[] = req.body.image.map((image : string) =>Image.create({ src: image }));
                const images = await Promise.all(promises);
                await newPost.addImages(images);

            }else {
                const image = await Image.create({ src: req.body.image });
                await newPost.addImage(image);
            }
        }
        const fullPost = await Post.findOne({
            where: {id: newPost.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: Image,
            }, {
                model: User,
                as: 'Likers',
                attributes: ['id'],
            }],
        });
        return res.json(fullPost);
    }catch(err) {
        console.error(err);
        return next(err);
    }
});

router.post('/images', upload.array('image'), (req, res) => {
    console.log(req.files);
    if(Array.isArray(req.files)) {
        res.json((req.files as Express.MulterS3.File[]).map((v) => v.location));
    }
})

router.get('/:id', async(req, res, next) => {
    try {

        const post = await Post.findOne({
            where: {id: req.params.id},
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: Image,
            }, {
                model: User,
                as: 'Likers',
                attributes: ['id'],
            }]
        })
        return res.json(post);
    }catch(err) {
        console.error(err);
        return next(err);
    }
})

router.delete('/:id', isLoggedIn, async(req, res, next) => {
    try {
        const post = await Post.findOne({ where: {id: req.params.id }});
        if(!post) {
            return res.status(404).send('???????????? ???????????? ????????????.');
        }
        await Post.destroy({ where: {id: req.params.id }});
        return res.send(req.params.id);
    }catch(err) {
        console.error(err);
        next(err);
    }
})

router.get('/:id/comments', async(req, res, next) => { // ???????????? ?????? ????????????
    try {
        const post = await Post.findOne({ where: {id: req.params.id }});
        if(!post) {
            return res.status(404).send('???????????? ???????????? ????????????.');
        }
        const comments = await Comment.findAll({
            where: {
                PostId: req.params.id,
            },
            order: [['createdAt', 'ASC']],
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }]
        });
        return res.json(comments);
    }catch(err) {
        console.error(err);
        next(err);
    }
})

router.post('/:id/comment', isLoggedIn, async(req, res, next) => {
    try {
        const post = await Post.findOne({ where: {id: req.params.id }});
        if(!post) {
            return res.status(404).send('???????????? ???????????? ????????????.');
        }
        const newComment = await Comment.create({
            PostId: post.id,
            UserId: req.user!.id,
            content: req.body.content,
        })
        //await post.addComment(newComment.id);

        const comment = await Comment.findOne({
            where: {
                id: newComment.id,
            },
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }],
        });
        return res.json(comment);
    }catch(err) {
        console.error(err);
        next(err);
    }
})

router.post('/:id/like', isLoggedIn, async(req, res, next) => { // ???????????? ????????? ?????????
    try {
        const post = await Post.findOne({ where: {id: req.params.id }});
        if(!post) {
            return res.status(404).send('???????????? ???????????? ????????????.');
        }
        await post.addLiker(req.user!.id);
        return res.json({ userId: req.user!.id });
    }catch(err) {
        console.error(err);
        next(err);
    }
});

router.delete('/:id/like', isLoggedIn, async(req, res, next) => { // ???????????? ????????? ??????
    try {
        const post = await Post.findOne({ where: {id: req.params.id }});
        if(!post) {
            return res.status(404).send('???????????? ???????????? ????????????.');
        }
        await post.removeLiker(req.user!.id);
        return res.json({ userId: req.user!.id });
    }catch(err) {
        console.error(err);
        next(err);
    }
});

router.post('/:id/retweet', isLoggedIn, async(req, res, next) => { // ????????? retweet ??????
    try {
        const post = await Post.findOne({
            where: { id: req.params.id },
            include: [{
                model: Post,
                as: 'Retweet',
            }],
        });
        if(!post) {
            return res.status(404).send('???????????? ???????????? ????????????.');
        }
        if(req.user!.id === post.UserId || (post.Retweet && post.Retweet.UserId === req.user!.id )) {
            return res.status(403).send('????????? ?????? ???????????? ??? ????????????.');
        }
        const retweetTargetId = post.RetweetId || post.id;
        const exPost = await Post.findOne({
            where: {
                UserId: req.user!.id,
                RetweetId: retweetTargetId,
            }
        });
        if(exPost) {
            return res.status(404).send('?????? ?????????????????????.');
        }
        const retweet = await Post.create({
            UserId: req.user!.id,
            RetweetId: retweetTargetId,
            content: 'retweet'
        });
        const retweetWithPrevPost = await Post.findOne({
            where: {id: retweet.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: Post,
                as: 'Retweet',
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }, {
                    model: Image,
                }]
            }],
        });
        return res.json(retweetWithPrevPost);
    }catch(err) {
        console.error(err);
        next(err);
    }
});
export default router;