const mongoose=require('mongoose');
const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter product name"],
        trim:true
    },
    description:{
        type:String,
        required:[true,"Please enter product description"]
    },
    price:{
        type:Number,
        required:[true,"Please enter product price"],
        maxlength:[6,"Product price cannot exceed than this"]
    },
    rating:{
        type:Number,
        default:0
    },
    images:[
        {
            public_id:{
                type:String,
                required:true
            },
            url:{
                type:String,
                required:true
            }
        }
    ],
    category:{
        type:String,
        required:[true,"Please enter product category"]
    },
    stock:{
      type:Number,
      required:[true,"Please enter stock"],
      maxlength:[4,"Stock cannot exceed than this limit"],
      default:1
    },
    numOfReviews:{
        type:Number,
        default:0
    },
    reviews:[
        {  user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
          },
           name:{
               type:String,
               required:true
           } ,
           rating:{
               type:Number,
               required:true
           },
           comment:{
               type:String,
            
           }
        }
    ] ,
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
    createdAt:{
        type:Date,
        default:Date.now
    }   
})

module.exports=mongoose.model("Product",productSchema)