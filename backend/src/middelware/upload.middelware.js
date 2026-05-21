import multer from 'multer';

const storage = multer.memoryStorage();


const filename = (req,file,cb)=>{
        const uniqueSuffix = Date.now();
        cb(null,`${uniqueSuffix}-${file.originalname}`);
    }

const upload = multer({storage: storage, filename: filename, limits: { fileSize: 50 * 1024 * 1024 }});

export default upload;