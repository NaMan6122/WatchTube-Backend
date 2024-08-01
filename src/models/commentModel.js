import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentModel = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    commentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    onVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    },
    onPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    },
}, {timestamps: true})

commentModel.plugin(mongooseAggregatePaginate);
export const Comment = mongoose.model("Comment", commentModel);