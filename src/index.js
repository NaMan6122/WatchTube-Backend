import dotenv from "dotenv";
import connectDB from "./dbConfig/dbConfig.js"

dotenv.config({
    path: "./env"
});
await connectDB(); //not a good practice, wrap this with a async function to achieve the same functionality.
















/*
//approach 1 using IFFE and simultaneous database connection.
const app = express();
( async() =>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("Error", (error) => {
            console.log("Error", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log("Server is running on port", process.env.PORT);
        })
    }catch{
        console.error("Error occurred in mongoDB connection", error);
    }
})();
*/