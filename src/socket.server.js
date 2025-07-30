import jwt from "jsonwebtoken"

export default function socketServer(io){
  io.use((socket, next)=>{
    const token = socket.handshake.auth.token
    if(!token){
      next(new Error("Error ja mom"))
      return
    }
    const payload = jwt.verify(token, process.env.SECRET)
    socket.user = payload
    console.log('payload', payload)
    next()
  })
  io.on("connection",(socket)=>{
    
  })
}