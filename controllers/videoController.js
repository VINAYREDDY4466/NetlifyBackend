import videoModel from "../models/videoModel.js";


const uploadVideo= async(req, res)=>{
    try{
        const video= new videoModel({videoUrl:req.file.path});
         await video.save();
         res.status(201).json({
            message:"video uploaded successfully",
            videoUrl:req.file.path,
         });
    }
    catch(error){
        res.status(500).json({message:"uploaded failed", error:error.message});
    }
}
const getVideos= async(req, res)=>{
    try{
        const videos= await videoModel.find().sort({ createdAt: -1 });

        res.status(200).json(videos);
    }
      catch(error){
        res.status(500).json({message:"uploaded failed"});
    }
}
const deleteVideo= async(req, res)=>{
    try{
        const video= await videoModel.findByIdAndDelete(req.params.id);
        if(!video){
            res.status(404).json({message:'video not found'});
        }
        res.json({message:'video deleted successfully'});
    }
    catch(error){
        res.status(500).json({message:"Error deleting video"});
    }
};

export {uploadVideo, getVideos, deleteVideo};