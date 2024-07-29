import {v2 as cloudinary} from "cloudinary";
import fs from "fs"; //Node.js file system module.

//setting up cloudinary.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        //uploading the file if it exists.
        const response = await cloudinary.uploader.upload("https://images.app.goo.gl/ntKhKQm2a4q7DQ1x9", {
            resource_type: "auto",
        });
        console.log("File is uploaded!")
        console.log(response, response.url);// response.url is the cloudinary url.
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //removing the file from the database, as the operation failed.
        return null;
    }
}
export {uploadOnCloudinary}

// documentation method:
// cloudinary.v2.uploader.upload("https://images.app.goo.gl/ntKhKQm2a4q7DQ1x9",
//     {
//         public_id: "scenary_pic"
//     },
//     function(error, result){
//         console.log(result);
//     }
// );