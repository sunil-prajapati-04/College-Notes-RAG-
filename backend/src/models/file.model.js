import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileHash:{
        type: String,
        required: true,
        unique: true
    },
    cloudUrl:{
        type: String,
        required: true
    }
});

const File = mongoose.model('File', fileSchema);
export default File;