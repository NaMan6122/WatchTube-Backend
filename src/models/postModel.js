import mongoose from "mongoose";

const postModel = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

}, {timestamps : true});

export const Post = mongoose.model("Post", postModel);