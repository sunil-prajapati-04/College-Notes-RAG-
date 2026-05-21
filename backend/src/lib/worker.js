import {Worker} from 'bullmq';
import pdf from 'pdf-parse-new';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { InferenceClient } from '@huggingface/inference';
import { Pinecone } from '@pinecone-database/pinecone';
import {config} from 'dotenv';
config();

const pineconeDb = new Pinecone({
    apiKey: process.env.PINECONEDB_APIKEY,
})
const pineconeIndex = pineconeDb.index("test");


const worker = new Worker('file-processing', async (job)=>{
    try {
        const response = await fetch(job.data.path);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Extract text from the PDF file
        const data = await pdf(buffer);
        console.log(data.text);


        // Split the extracted text into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await textSplitter.createDocuments([data.text]);


        console.log(chunks[1]);
        console.log(chunks.length);

        // Generate embeddings for the text chunks
        console.log("embeddings started...");

        const embeddings = new HuggingFaceInferenceEmbeddings({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            apiKey: process.env.HF_APIKEY,
        });

        // embedding model generate vectors of text chunks and return in the form of array of arrays
        const vectors = await embeddings.embedDocuments(chunks.map((chunk) => chunk.pageContent));

        console.log("embeddings completed");
        console.log(vectors.length);
        console.log(vectors[0].length);

        // Prepare records for Pinecone database in the format { id, values, metadata }
        const records = vectors.map((vector, index) => ({
            id: `${job.id}-${index}`,
            values: vector,
            metadata: {
                text: chunks[index].pageContent,
                fileName: job.data.originalname
            }
        }));

        console.log("records length:", records.length);
        console.log(records[0]);


        // Upsert(storing vector data in pinecone database) vectors into the Pinecone database  
        await pineconeIndex.namespace("__default__").upsert({
            records: records,
        });

        console.log("vectors successfully stored in database");

    } catch (error) {
        console.error("Error processing file:", error);
    }
},{
    connection:{
        url: process.env.REDIS_URL
    }   
})