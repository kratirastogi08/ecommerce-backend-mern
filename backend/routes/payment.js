const express = require("express");
const router=express.Router()
const {isAuthenticatedUser}=require('../middleware/auth')
const catchAsyncErrors=require('../middleware/catchAsyncErrors.js')
const stripe = require("stripe")('sk_test_51KpWa9SEriMxkovltSm4Rw7tZBxJ5OeeQkKVe3wDb5N4VJBSORDKQ1GtkS4FfIe1XVcrVTeB74Rq6kHJ5TknBhhH00mmz8rGh3');
const dotenv=require('dotenv')
dotenv.config({path:'./config/config.env'})

router.post('/process',catchAsyncErrors(async(req,res,next)=>{
  console.log("o",req.headers)
    const myPayment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "inr",
        metadata: {
          company: "Ecommerce",
        },
      });
      res
    .status(200)
    .json({ success: true, client_secret: myPayment.client_secret });
}))

router.get('/stripeapikey',catchAsyncErrors(async(req,res,next)=>{
    res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
}))

module.exports=router