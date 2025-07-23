
import jwt from "jsonwebtoken";
import createError from "../utils/create-error.util.js";

export const authCheck = (req,res,next) => {
  //code body
try {

const header = req.headers.authorization;
// console.log(header)
if(!header){
  createError(401,"Token is missing!!!")
}

//2. Split token
const token = header.split(' ')[1]
// console.log(token)

//3. Verify Token
jwt.verify(token,process.env.SECRET,(error,decode)=>{
  // console.log(error)
  // console.log(decode)
  if(error) {
    createError(401,"Token is Invalid!!!")
  }

  req.user = decode
  next(error);

})


} catch (error) {
  next(error)
}
}