import {Queue} from 'bullmq';
import {config} from 'dotenv';
config();

const queue= new Queue('file-processing',{
    connection:{
        url: process.env.REDIS_URL,
    }
});

export default queue;
