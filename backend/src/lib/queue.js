import {Queue} from 'bullmq';
import {config} from 'dotenv';
config();

const queue= new Queue('file-processing',{
    connection:{
        host:process.env.REDIS_HOST,
        port:process.env.REDIS_PORT
    }
});

export default queue;
