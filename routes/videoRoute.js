import express from "express";
import { deleteVideo, getVideos, uploadVideo } from "../controllers/videoController.js";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
const upload= multer({storage});

const videoRouter= express.Router();

videoRouter.post('/upload',upload.single('video'), uploadVideo);
videoRouter.get('/',getVideos);
videoRouter.delete('/:id',deleteVideo);

export  default videoRouter;