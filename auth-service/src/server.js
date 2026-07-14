require('dotenv').config();
const express=require('express'), cors=require('cors'), helmet=require('helmet'), morgan=require('morgan');
const routes=require('./routes/auth.routes'); const app=express();
app.use(cors()); app.use(helmet()); app.use(morgan('dev')); app.use(express.json());
app.get('/health',(_,res)=>res.json({service:'auth-service',status:'OK'})); app.use('/auth',routes);
app.listen(process.env.PORT||4001,()=>console.log('Auth Service lancé'));
