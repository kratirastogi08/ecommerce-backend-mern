const express=require('express');
const router=express.Router();
const catchAsyncErrors=require('../middleware/catchAsyncErrors.js')
const Order=require("../model/orderModel");
const ErrorHandler = require('../utilities/errorHandler');
const Product=require('../model/products');
const { isAuthenticatedUser } = require('../middleware/auth.js');

router.post("/newOrder",catchAsyncErrors(async (req,res,next)=>{
         const { shippingInfo,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,}=req.body;
            const order = await  Order.create({
                shippingInfo,
                orderItems,
                paymentInfo,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
                paidAt:Date.now(),
                user: req.user._id,
           })  
           res.status(201).json({
            success: true,
            order,
          });        
}

))

router.get("/getSingleOrder/:id",catchAsyncErrors(async (req,res,next)=>{
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
      );
    
      if (!order) {
        return next(new ErrorHandler("Order not found with this Id", 404));
      }
    
      res.status(200).json({
        success: true,
        order,
      });       
}

))

router.get("/myOrders",isAuthenticatedUser,catchAsyncErrors(async (req,res,next)=>{
    const orders = await Order.find({user:req.user._id})

     res.status(200).json({
        success: true,
        orders,
      });       
}

))

router.get("/getAllOrders",catchAsyncErrors(async (req,res,next)=>{
    const orders = await Order.find()
     
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });     
}

))

router.put("/updateOrder/:id",catchAsyncErrors(async (req,res,next)=>{
    const order = await Order.findById(req.params.id)

    if(!order)
    {
        return next(new ErrorHandler("Order not found with id",404))
    }
    if(order.orderStatus==='Delivered')
    {
        return next(new ErrorHandler("You have already delivered this order", 400));
    }
    if(req.body.status==='Shipped')
    {
        order.orderItems.forEach(async(o)=>{
           await updateStock(o.product,o.quantity)
        })
    }

    order.orderStatus=req.body.status;
    if(req.body.status==='Delivered')
    {
       order.deliveredAt=Date.now()
    }

    await order.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
    });
      
}

))
async function updateStock(id, quantity) {
    const product = await Product.findById(id);
  
    product.Stock -= quantity;
  
    await product.save({ validateBeforeSave: false });
  }
  router.delete("/deleteOrder/:id",catchAsyncErrors(async (req,res,next)=>{
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorHandler("Order not found with this Id", 404));
    }
  
    await order.remove();
  
    res.status(200).json({
      success: true,
    });
}

))

module.exports=router;
