import express from 'express';
import {config} from 'dotenv';
import bodyParser from 'body-parser';
import notesRoutes from './routes/note.route.js';
import authRoutes from './routes/auth.route.js';
import connectDB from './middelware/db.js';
import cors from 'cors';
import helmet from 'helmet';
config();

const app = express();
const port = process.env.PORT;
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
].filter(Boolean).map((url)=>url.replace(/\/$/, ''));

app.use(cors({
    origin:(origin,callback)=>{
        if(!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))){
            return callback(null,true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials:true,
}));

app.use(helmet());

app.use(bodyParser.json());

app.use('/myRag/auth',authRoutes);
app.use('/myRag/note',notesRoutes);

const startServer = async ()=>{
    await connectDB();
    
    app.listen(port,()=>{
    console.log(`server is listening on ${port}`);
})
};

startServer();

