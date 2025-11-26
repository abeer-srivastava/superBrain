import mongoose, { Schema } from "mongoose";
import User from "./user.js";
const contentType=["tweet","video","article","document","link"];
const contentSchema=new Schema({
    link:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    // todo:tags
    tags:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tags",

    }],
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    shareLink:{
      type:String, 
    },
    type:{
        type:String,
        enum:contentType,
        required:true
    },
  embedding: {
    type: [Number], // store locally if you want (optional)
    default: []
  }
},{timestamps:true});
contentSchema.pre("save",async function(next){
    const userId=this.userId;
    if(!userId) throw new Error("user doesnot exist");
    const user=await User.findById(userId);
    if(!user){
        throw new Error("user doesnot exist in db");
    }
    next();
});

const Content=mongoose.model("Content",contentSchema);
export default Content