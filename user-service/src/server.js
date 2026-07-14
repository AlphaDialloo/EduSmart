require('dotenv').config();
const express=require('express'), cors=require('cors'), helmet=require('helmet'), morgan=require('morgan');
const routes=require('./routes/user.routes'); const app=express();
app.use(cors()); app.use(helmet()); app.use(morgan('dev')); app.use(express.json());
app.get('/health',(_,res)=>res.json({service:'user-service',status:'OK'})); app.use('/users',routes);
app.listen(process.env.PORT||4002,()=>console.log('User Service lancé'));
