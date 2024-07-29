import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoModel = new mongoose.Schema({
    videoFile: {
        type: String, //cloudinary url.
        required: true,
    },
    thumbnail: {
        type: String, //cloudinary url.
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number, //from cloudinary properties.
        required: true,
    },
    views: {
        type: Number,
        default: 0,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, {timestamps: true});

//aggregation queries can be written now[we are using this to handle and process the watch history field**].
videoModel.plugin(mongooseAggregatePaginate);

//Aggregation queries in MongoDB are used to process data records and return computed results. 
//These queries allow for operations such as filtering, grouping, sorting, and reshaping documents within a collection.
//The aggregation framework operates through an aggregation pipeline,
// where each stage transforms the documents in some way and passes the results to the next stage.

//Pagination is used to divide a large dataset into smaller, manageable chunks (pages). 
//Pagination allows you to fetch a subset of the results, 
//which is particularly useful for displaying data in a user interface.

export const Video = mongoose.model("Video", videoModel);