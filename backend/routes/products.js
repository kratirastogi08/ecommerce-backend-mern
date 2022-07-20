const express=require('express')
const router=express.Router()
const products=require("../controllers/product")
const Product=require('../model/products')
const ErrorHandler=require('../utilities/errorHandler')
const catchAsyncErrors=require('../middleware/catchAsyncErrors.js')
const {isAuthenticatedUser,authorizedRoles}=require('../middleware/auth')
const ApiFeatures=require('../utilities/ApiFeatures')
const cloudinary = require("cloudinary");


router.get("/getAllProducts",catchAsyncErrors(async(req,res,next)=>{
    const resultPerPage = 4;
    const productsCount = await Product.countDocuments();
  
    const apiFeature = new ApiFeatures(Product.find(), req.query)
      .search()
      .filter();
  
    let products1 = await apiFeature.query;
  
    let filteredProductsCount = products1.length;
  
    apiFeature.pagination(resultPerPage);
  
    products1 = await apiFeature.query.clone();
    
  if(products1.length===0)
  {
    next(new ErrorHandler("No products available",400))  
  }
  else{
    res.status(200).json({
      success: true,
      products1,
      productsCount,
      resultPerPage,
      filteredProductsCount,
    });}
}))

router.post("/createProduct",isAuthenticatedUser,authorizedRoles(['admin']),catchAsyncErrors(async(req,res,next)=>{
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  const imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "products",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
    req.body.user=req.user._id
    const createProduct= await products.createProduct(req.body)
    return res.status(200).json({message:`Product with ID ${createProduct._id} is created successfully`,status:true,product:createProduct})
         
}))

router.put("/updateProduct/:id",isAuthenticatedUser,authorizedRoles(['admin']),catchAsyncErrors(async(req,res,next)=>{
    const productById= await Product.findById(req.params.id)
    if(!productById)  
     next(new ErrorHandler(`No such product found`,400))

     // Images Start Here
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting Images From Cloudinary
    for (let i = 0; i < productById.images.length; i++) {
      await cloudinary.v2.uploader.destroy(productById.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }
     const updatedProduct=await Product.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})
    if(updatedProduct)
     return res.status(200).json({message:`Product with ID ${updatedProduct._id} is created updated`,status:true,product:updatedProduct})
    else
     next(new ErrorHandler("Product not updated successfully",400))       
}))

router.delete("/deleteProduct/:id",isAuthenticatedUser,authorizedRoles(['admin']),catchAsyncErrors(async(req,res,next)=>{
            const selectedProduct=  await Product.findById(req.params.id)
            if(!selectedProduct)
            next(new ErrorHandler("Product not found",400))

            for (let i = 0; i < selectedProduct.images.length; i++) {
              await cloudinary.v2.uploader.destroy(selectedProduct.images[i].public_id);
            }

            await selectedProduct.remove()
           return res.status(200).json({status:true,message:`Product with ID ${selectedProduct._id} got successfully deleted`})
}))

router.get("/getProductById/:id",catchAsyncErrors(async(req,res,next)=>{
      const productDetails= await Product.findById(req.params.id)
      if(!productDetails)
       next(new ErrorHandler("Product not found",400))
       return res.status(200).json({status:true,productDetails})
}))

// Get All Product (Admin)
router.get("/admin/allproducts",catchAsyncErrors(async(req,res,next)=>{
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
}))
// Create New Review or Update the review
router.put("/createProductReview",isAuthenticatedUser,catchAsyncErrors(async (req, res, next) => {
    const { rating, comment, productId } = req.body;
  
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };
  
    const product = await Product.findById(productId);
  
    const isReviewed = product.reviews.find(
      (rev) => rev.user.toString() === req.user._id.toString()
    );
  
    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user._id.toString())
          (rev.rating = rating), (rev.comment = comment);
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
  
    let avg = 0;
  
    product.reviews.forEach((rev) => {
      avg += rev.rating;
    });
  
    product.rating = avg / product.reviews.length;
  
    await product.save({ validateBeforeSave: false });
  
    res.status(200).json({
      success: true,
    });
  }))

  // Get All Reviews of a product
router.get("/getProductReviews", catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id);
  
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
  
    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  }))

  router.delete("/deleteReview",isAuthenticatedUser,catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
  
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
  
    const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.id.toString()
    );
  
    let avg = 0;
  
    reviews.forEach((rev) => {
      avg += rev.rating;
    });
  
    let rating = 0;
  
    if (reviews.length === 0) {
      rating = 0;
    } else {
      rating = avg / reviews.length;
    }
  
    const numOfReviews = reviews.length;
  
    await Product.findByIdAndUpdate(
      req.query.productId,
      {
        reviews,
        rating,
        numOfReviews,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
  
    res.status(200).json({
      success: true,
    });
  }))
module.exports=router