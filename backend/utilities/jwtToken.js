const sendToken=(user,statuscode,res)=>{
     const token=  user.getJWTtoken();
     const options={
        expires:new Date(Date.now()+process.env.EXPIRE*24*60*60*1000),
        httpOnly: true,
     }
     return res.cookie("token",token,options).status(statuscode).json({success:true,user,token});
     
   
}

module.exports=sendToken;