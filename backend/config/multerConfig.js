import multer from "multer"
import path from "path"
import {fileURLtoPath} from "url"

//GET __dirname in ES modules
const __filename = fileURLtoPath(import.meta.url)
const __dirname = path.dirname(__filename)

//storage configuration
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        //save the files to upload folder
        cb(null,path.join(__dirname,'../uploads'));
    },
    filename: function(req,file,cb){
        //create unique filename:timestamp-originalname
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null,uniqueName);
    }
});

//file filter

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false); // Reject file
  }
};

//multer instance
const upload = multer({
    storage:storage,
    fileFilter:fileFilter,
    limits:{
        fileSize:50*1024*1024  //50MB max file size
    }
});

export default upload;
