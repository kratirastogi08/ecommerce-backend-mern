const app=require('./app')
const bodyParser=require("body-parser")
const dotenv=require('dotenv')
const connection=require('./config/database.js')
const router=require('./routes/products.js')
const userRouter=require('./routes/users')
const orderRouter=require('./routes/order')
const paymentRouter=require('./routes/payment')
const errorHandler=require('./middleware/error')
const cookieParser=require("cookie-parser")
const fileUpload = require("express-fileupload");
var cors = require('cors')
const express = require('express')
const cloudinary = require("cloudinary");

process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    process.exit(1);
  });

dotenv.config({path:'./config/config.env'})
connection()
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.use(cors())
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload());
app.use("/products",router)
app.use("/users",userRouter)
app.use("/orders",orderRouter)
app.use("/payment",paymentRouter)
app.use(errorHandler)

const server=app.listen(process.env.PORT,()=>{
})


// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);
  
    server.close(() => {
      process.exit(1);
    });
  });