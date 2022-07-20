const Product=require('../model/products')
const ApiFeatures=require('../utilities/ApiFeatures')
const ErrorHandler=require('../utilities/errorHandler')
const products={}
products.createProduct=async (product)=>{
  const productData= await Product.create(product)
  if(productData)
  {
      return productData
  }
  else
  {
    next(new ErrorHandler(`Products couldn't be aded`,400))
  }
}

products.getAllProducts=async(req,res,next)=>{
     const resultsPerPage=5
     const productsCount = await Product.countDocuments();
     const apiFeatures= new ApiFeatures(Product.find(),req.query).search().filter()
     let productss = await apiFeatures.query;

  let filteredProductsCount = productss.length;
   apiFeatures.pagination(resultsPerPage);
      productss= await apiFeatures.query.clone()
     if(productss && productss.length)
     {
         return {
            productss,
            productsCount,
            resultsPerPage,
            filteredProductsCount}
     }
     else
     {  
       return next(new ErrorHandler(`No products available`,400))
     }
}

module.exports=products