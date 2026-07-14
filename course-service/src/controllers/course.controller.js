const Course=require('../models/Course');
exports.create=async(req,res)=>{try{const course=await Course.create({...req.body,instructorId:req.user.id});res.status(201).json({message:'Cours créé',course});}catch(e){res.status(500).json({message:'Erreur serveur',error:e.message});}};
exports.list=async(req,res)=>{const filter={status:'PUBLISHED'}; if(req.query.level)filter.level=req.query.level; if(req.query.category)filter.category=req.query.category; const courses=await Course.find(filter).sort({createdAt:-1}); res.json(courses);};
exports.getOne=async(req,res)=>{const c=await Course.findById(req.params.id); if(!c)return res.status(404).json({message:'Cours introuvable'}); res.json(c);};
exports.addModule=async(req,res)=>{const c=await Course.findByIdAndUpdate(req.params.id,{$push:{modules:req.body}},{new:true});res.json({message:'Module ajouté',course:c});};
exports.addResource=async(req,res)=>{const c=await Course.findById(req.params.courseId); if(!c)return res.status(404).json({message:'Cours introuvable'}); const m=c.modules.id(req.params.moduleId); if(!m)return res.status(404).json({message:'Module introuvable'}); m.resources.push(req.body); await c.save(); res.json({message:'Ressource ajoutée',course:c});};
exports.publish=async(req,res)=>{const c=await Course.findByIdAndUpdate(req.params.id,{status:'PUBLISHED'},{new:true}); res.json({message:'Cours publié',course:c});};
