const ForumPost=require('../models/ForumPost'), Comment=require('../models/Comment');
exports.post=async(req,res)=>{const post=await ForumPost.create({...req.body,authorId:req.user.id});res.status(201).json(post);};
exports.posts=async(req,res)=>{res.json(await ForumPost.find({courseId:req.params.courseId}).sort({createdAt:-1}));};
exports.comment=async(req,res)=>{const c=await Comment.create({postId:req.params.postId,authorId:req.user.id,content:req.body.content});res.status(201).json(c);};
exports.comments=async(req,res)=>{res.json(await Comment.find({postId:req.params.postId}).sort({createdAt:1}));};
