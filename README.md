# College Notes RAG Assistant

A full-stack college notes assistant where users can sign up, log in, upload PDF notes, and ask questions from the uploaded notes. The backend processes PDF files, stores embeddings in Pinecone, and answers user questions using Hugging Face inference.

## Project Note

- Backend: completely built by me.
- Frontend: built with the help of ChatGPT.

## Features

- User signup and login with JWT authentication
- Protected note upload and question-answer APIs
- PDF upload using Multer and Cloudinary
- Background file processing with BullMQ and Redis
- PDF text extraction and chunking
- Embeddings with Hugging Face / LangChain
- Vector search with Pinecone
- Chat-style frontend for asking questions from notes
- Persistent chat history on refresh
- Clear chat option
- Profile hover card with user details and logout
- Toast notifications for success/error messages

## Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB / Mongoose
- JWT
- Multer
- Cloudinary
- BullMQ
- Redis
- Pinecone
- Hugging Face Inference
- LangChain

### Frontend

- React.js
- Vite
- Axios
- React Hot Toast
- Lucide React

## Folder Structure

```txt
clgNotes/
  backend/
    src/
      controllers/
      lib/
      middelware/
      models/
      routes/
    package.json
  frontend/
    src/
      App.jsx
      App.css
      main.jsx
    package.json
```

## Backend Environment Variables

Create a `.env` file inside the `backend` folder.

```env
PORT=8080
MONGODBURL=your_mongodb_url
SCERECTKEY=your_jwt_secret
CLIENT_URL=http://localhost:5173

PINECONEDB_APIKEY=your_pinecone_api_key
HF_APIKEY=your_huggingface_api_key

REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Frontend Environment Variables

Create a `.env` file inside the `frontend` folder when deploying or when you want to call the backend directly.

```env
VITE_API_URL=http://localhost:8080
```

For deployment, replace this with your deployed backend URL:

```env
VITE_API_URL=https://your-backend-url.com
```

Also set `CLIENT_URL` in the backend `.env` to your deployed frontend URL so CORS allows requests from the frontend.

If `VITE_API_URL` is empty, the frontend uses relative API paths and local Vite proxy can handle `/myRag` requests during development.

## API Routes

Base backend URL:

```txt
http://localhost:8080
```

### Auth Routes

```txt
POST /myRag/auth/signup
POST /myRag/auth/login
GET  /myRag/auth/myProfile
POST /myRag/auth/logout
```

### Note Routes

```txt
POST /myRag/note/upload
GET  /myRag/note/getNote?question=your_question
```

The note routes are protected, so the frontend sends the JWT token in the `Authorization` header.

## Run Locally

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start Backend Server

```bash
npm run dev
```

### 3. Start Worker

Open another terminal:

```bash
cd backend
npm run worker
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start Frontend

```bash
npm run dev
```

Frontend will run on:

```txt
http://localhost:5173
```

## Frontend API Configuration

The frontend uses Axios with these base URLs:

```js
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE_URL}/myRag/note`,
});

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/myRag/auth`,
});
```

Vite proxy forwards `/myRag` requests to the backend server on port `8080`.

## Usage Flow

1. Open the frontend.
2. Sign up or log in.
3. Upload a PDF notes file.
4. Wait for the file to process through the worker.
5. Ask questions from the uploaded notes.
6. Use the profile tab to view details or logout.

## Build Frontend

```bash
cd frontend
npm run build
```

## Notes

- Redis must be running for the BullMQ worker.
- MongoDB must be connected before using auth and file APIs.
- Pinecone and Hugging Face API keys are required for question answering.
- Cloudinary credentials are required for PDF upload storage.
