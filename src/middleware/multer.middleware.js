import multer from "multer"

//configuring multer, storing file on disk and not on memory, read multer documentation.
const storage = multer.diskStorage({
    //cb is callback function () => {} here.
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        //adding a randomized suffix in the original filename for security purposes and naming conflicts.
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  });
  
  //creating the upload variable using multer function:
  //The multer function expects an object with configuration options, not the storage object itself. 
export const upload = multer({storage : storage});

//middleware basically adds more fields in the request object, such as req.files by multer.