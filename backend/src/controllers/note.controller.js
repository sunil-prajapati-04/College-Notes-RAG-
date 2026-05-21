import queue from '../lib/queue.js';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { InferenceClient } from '@huggingface/inference';
import { Pinecone } from '@pinecone-database/pinecone';
import crypto from 'crypto';
import cloudinary from '../lib/cloudinary.js';
import File from '../models/file.model.js';
import { config } from 'dotenv';
config();

const pineconeDb = new Pinecone({
    apiKey: process.env.PINECONEDB_APIKEY,
})
const pineconeIndex = pineconeDb.index("test");


export const uploadFile = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Generate a unique hash for the file using its content
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // Check if a file with the same hash already exists in the database
        const existingFile = await File.findOne({ userId: req.user._id, fileHash });
        if (existingFile) {
            return res.status(409).json({ message: "File already uploaded. You can query it directly." });
        }


        // Upload the PDF file to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {

            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "raw",
                    folder: "pdf_files"
                },
                (error, result) => {
                    if (error) return reject(error);

                    resolve(result);
                }
            );

            stream.end(file.buffer);
        });

        // Save file metadata to MongoDB
        const newFile = new File({
            userId: req.user._id,
            fileName: file.originalname,
            fileHash: fileHash,
            cloudUrl: uploadResult.secure_url
        });
        await newFile.save();

        // Add a job to the queue for processing the uploaded file
        await queue.add('process-file',
            {
                path: uploadResult.secure_url,
                originalname: file.originalname
            }
        );

        return res.status(200).json({ message: "File uploaded and processed successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}



export const queryFile = async (req, res) => {
    try {
        const query = req.query.question;
        if (!query) {
            return res.status(400).json({ message: "Query is required" });
        }
        const embeddings = new HuggingFaceInferenceEmbeddings({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            apiKey: process.env.HF_APIKEY,
        });

        const queryVector = await embeddings.embedQuery(query);

        const result = await pineconeIndex.namespace("__default__").query({
            topK: 5,
            vector: queryVector,
            includeMetadata: true,
        });
        console.log(result);
        if (result.matches.length === 0) {
            return res.status(404).json({
                message: "No relevant notes found"
            });
        }


        const retDocs = result.matches.map((match) => (match.metadata.text)).join("\n\n");

        const client = new InferenceClient(process.env.HF_APIKEY);

        const chatCompletion = await client.chatCompletion({
            model: 'meta-llama/Llama-3.1-8B-Instruct:novita',
            messages: [
                {
                    role: 'system',
                    content: `You are a college notes assistant.Answer ONLY from context.If answer not found say:"Answer not found in notes"`
                },
                {
                    role: 'user',
                    content: `
                    context:
                    ${retDocs} 
                    
                    question:
                    ${query}`
                }
            ]
        })
        console.log(chatCompletion.choices);
        return res.status(200).json({ answer: chatCompletion.choices[0].message.content });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}