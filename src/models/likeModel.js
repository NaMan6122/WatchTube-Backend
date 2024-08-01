import mongoose from "mongoose";

const likeModel = new mongoose.Schema({
    onVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    },
    onPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    },
    onComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
}, {timestamps: true});

export const Like = mongooose.model("Like", likeModel);