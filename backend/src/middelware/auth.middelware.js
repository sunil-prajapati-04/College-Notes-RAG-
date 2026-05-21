import jwtToken from 'jsonwebtoken';
import { config } from 'dotenv';
config();

const secrectKey = process.env.SCERECTKEY;

const authMiddleware = async(req,res,next)=>{
    try {
        const cookieToken = req.cookies?.ragToken || req.headers.authorization?.split(" ")[1];
        if(!cookieToken){
            return res.status(404).json({message:"Token not found"});
        }
        jwtToken.verify(cookieToken,secrectKey,(err,decoded)=>{
           if(err){
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: "Token expired, please login again" });
                } else if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ error: "Invalid token format" });
                } else {
                    return res.status(401).json({ error: "Token verification failed" });
                }
            }else{
                req.user = decoded;
                next();
            }
        })
    } catch (error) {
        console.log("error in authMiddleware controller:",error);
        return res.status(500).json({message:"Internal server error"})
    }
}

export default authMiddleware;