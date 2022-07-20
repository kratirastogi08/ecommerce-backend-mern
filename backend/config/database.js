const mongoose=require('mongoose')


const connection=()=>{
    mongoose.connect(process.env.DB_URI,{useNewURLParser:true,useUnifiedTopology:true})
    .then((data)=>{
     console.log("Connected to server",data.connection.host)
    })
}

module.exports=connection