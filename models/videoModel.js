import mongoose from "mongoose";

const videoSchema= new mongoose.Schema(
    {
    videoUrl:{
        type:String,
        required:true,
    },
    },
    {
        timestamps:true
    }
);

const videoModel = mongoose.model('video', videoSchema);
export  default videoModel;