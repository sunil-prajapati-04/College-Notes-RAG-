import User from '../models/user.model.js';
import genToken from '../lib/jwt.js';

export const signup = async(req,res)=>{
    try {
        const {name,email,password} = req.body;
        const user = await User.findOne({email});
        if(user){
            return res.status(401).json({message:"email already exists"});
        }
        if(!name || !email || !password){
            return res.status(401).json({message:"All fields are required"});
        }
        if(password.length<8){
            return res.status(401).json({message:"password must pe atleast length of 8"});
        }
        const newUser  = new User({
            name,
            email,
            password
        })
        await newUser.save();
        return res.status(200).json({message:"User registered successfully"});
    } catch (error) {
        console.log("error in signup controller:",error);
        return res.status(500).json({message:"Internal server error"})
    }
}


export const login = async(req,res)=>{
    try {
        const {email,password} = req.body;
        const user  = await User.findOne({email});
        if(!user || !(await user.comparePassword(password))){
            return res.status(404).json({message:"email or password is invalid"});
        }
        const payload = {
            _id:user.id,
            username:user.name
        }
        const token = await genToken(payload);
        res.cookie("ragToken",token,{
            maxAge: 2*24*60*60*1000,
            httpOnly: true,
            secure: true,
            sameSite: "None"
        })
        console.log("token:",token);
        return res.status(200).json(token)
    } catch (error) {
        console.log("error in login contorller:",error);
        res.status(500).json({message:"Internal server error"});
    }
} 

export const myProfile = async(req,res)=>{
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password");
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        return res.status(200).json(user);
    } catch (error) {
        console.log("error in myProfile controller:",error);
        return res.status(500).json({message:"Internal serve error"})
    }
}

export const logout = async(req,res)=>{
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        res.clearCookie("ragToken",{
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });
        return res.status(200).json({message:"Logout successfully"});
    } catch (error) {
        console.log("error in logout controller:",error);
        return res.status(500).json({message:"Internal server error"})
    }
}
