import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    }
});

userSchema.pre('save', async function (next) {
    try {
        const user = this;
        if (!user.isModified('password')) return next();
        const genSalt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(user.password, genSalt);
        user.password = hashPassword;
    } catch (error) {
        throw error;
    }
});

userSchema.methods.comparePassword = async function (password) {
    const isMatch = await bcrypt.compare(password, this.password);
    return isMatch;
};

const User = mongoose.model('User', userSchema);
export default User;