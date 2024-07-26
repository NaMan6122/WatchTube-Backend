import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({
    limit: "50kb",
}));

app.use(express.urlencoded({
    limit: "50kb",
    extended: true,
}));

//static files, learn about them if needed.
app.use(express.static("public"))

app.use(cookieParser());


export { app }

