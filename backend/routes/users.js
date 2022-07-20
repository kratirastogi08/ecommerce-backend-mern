const express=require('express')
const router=express.Router()
const catchAsyncErrors=require('../middleware/catchAsyncErrors')
const user=require('../model/userModel')
const sendToken=require('../utilities/jwtToken')
const sendEmail=require('../utilities/sendEmail')
const ErrorHandler=require('../utilities/errorHandler')
const { isAuthenticatedUser,authorizedRoles } = require('../middleware/auth')
const cloudinary = require("cloudinary");


router.post('/registerUser',catchAsyncErrors(async(req,res,next)=>{
  const {email,name,password}=req.body;
  let currentUser;
  if(req.body.avatar)
  {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
     currentUser=   await user.create({email,name,password,avatar:{public_id: myCloud.public_id,
      url: myCloud.secure_url}})
  }
  else
  {
     currentUser=   await user.create({email,name,password})
  }
  
    
    
    sendToken(currentUser,201,res)
}))
router.get('/getUser',catchAsyncErrors(async(req,res,next)=>{
    const users=await user.find({})
    res.status(201).json({success:true,users})
}))

router.post("/loginUser",catchAsyncErrors(async (req,res,next)=>{
  console.log("po",req.body)
        const {email,password} = req.body;
        if(!email ||!password)
        {
           return next(new Error("Please enter email or passord",400))
        }
        const currentUser= await user.findOne({email}).select("+password")
        if(!currentUser)
        {
          return  next(new Error("Invalid email or passord",401))
        }
          const isPasswordMatched=await currentUser.comparePassword(password)

          if(!isPasswordMatched)
          {
              return next(new Error("Invalid email or passord",401))
          }
       console.log("u",currentUser)
         sendToken(currentUser,200,res)
}))

router.get("/logout",catchAsyncErrors(async(req,res,next)=>{
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
    
      res.status(200).json({
        success: true,
        message: "Logged Out",
      });
}))

router.post("/forgotPassword",catchAsyncErrors(async (req,res,next)=>{
    const currentUser = await user.findOne({ email: req.body.email });
     console.log("io",currentUser)
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
    const resetToken = currentUser.getResetPasswordToken();

    await currentUser.save({ validateBeforeSave: false });
   const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: currentUser.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${currentUser.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await currentUser.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
}))

router.put("/password/reset/:token",catchAsyncErrors(async(req,res,next)=>{
  const resetPasswordToken = crypto
  .createHash("sha256")
  .update(req.params.token)
  .digest("hex");

const currentUser = await user.findOne({
  resetPasswordToken,
  resetPasswordExpire: { $gt: Date.now() },
});

if (!currentUser) {
  return next(
    new ErrorHander(
      "Reset Password Token is invalid or has been expired",
      400
    )
  );
}

if (req.body.password !== req.body.confirmPassword) {
  return next(new ErrorHandler("Password does not password", 400));
}

currentUser.password = req.body.password;
currentUser.resetPasswordToken = undefined;
currentUser.resetPasswordExpire = undefined;

await currentUser.save();

sendToken(currentUser, 200, res);
}))

// Get User Detail
router.get("/getUserDetails",isAuthenticatedUser,catchAsyncErrors(async (req, res, next) => {
  const currentUser = await user.findById(req.user._id);

  res.status(200).json({
    success: true,
    currentUser,
  });
}))


// update User password
router.put("/updatePassword",isAuthenticatedUser,catchAsyncErrors(async (req, res, next) => {
  const currentUser = await user.findById(req.user._id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("password does not match", 400));
  }

  currentUser.password = req.body.newPassword;

  await currentUser.save();

  sendToken(currentUser, 200, res);
}))

router.put("/updateProfile",isAuthenticatedUser, catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  if (req.body.avatar !== "") {
    const updatedUser = await user.findById(req.user.id);

    const imageId = updatedUser.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newUserData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }
 const currentUser = await updatedUser.findByIdAndUpdate(req.user._id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
}))

router.get("/getAllUsers",isAuthenticatedUser,authorizedRoles(['admin']),catchAsyncErrors(async (req, res, next) => {
  const users = await user.find();

  res.status(200).json({
    success: true,
    users,
  });
}))

router.get("/getSingleUser/:id",isAuthenticatedUser,authorizedRoles(['admin']), catchAsyncErrors(async (req, res, next) => {
  const currentUser = await user.findById(req.params.id);

  if (!currentUser) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.id}`)
    );
  }
  res.status(200).json({
    success: true,
    currentUser,
  });
}))

router.put("/updateUserRole/:id",isAuthenticatedUser,authorizedRoles(['admin']),catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await user.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
}))

router.delete("/deleteUser/:id",isAuthenticatedUser,authorizedRoles(['admin']),catchAsyncErrors(async (req, res, next) => {
  const currentUser = await user.findById(req.params.id);

  if (!currentUser) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 400)
    );
  }
  const imageId = user.avatar.public_id;

  await cloudinary.v2.uploader.destroy(imageId);
await currentUser.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  })
}))



module.exports=router