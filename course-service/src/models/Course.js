const mongoose=require('mongoose');
const resource=new mongoose.Schema({title:{type:String,required:true},type:{type:String,enum:['VIDEO','PDF','ARTICLE','EXERCISE','QUIZ'],required:true},url:String,duration:Number,content:String},{timestamps:true});
const moduleSchema=new mongoose.Schema({title:{type:String,required:true},order:{type:Number,default:1},resources:[resource]},{timestamps:true});
const course=new mongoose.Schema({title:{type:String,required:true},description:String,category:{type:String,required:true},level:{type:String,enum:['BEGINNER','INTERMEDIATE','ADVANCED'],default:'BEGINNER'},tags:[String],instructorId:{type:String,required:true},status:{type:String,enum:['DRAFT','PUBLISHED','ARCHIVED'],default:'DRAFT'},modules:[moduleSchema],quizzes:[Object]},{timestamps:true});
module.exports=mongoose.model('Course',course);
