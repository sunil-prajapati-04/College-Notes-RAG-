import jwtToken from "jsonwebtoken";
import { config } from "dotenv";
config();

const secrectKey = process.env.SCERECTKEY;

const genToken = (payload)=>{
    const token = jwtToken.sign(payload,secrectKey,{expiresIn:"2d"});
    return token;
}

export default genToken;