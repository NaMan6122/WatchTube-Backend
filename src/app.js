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

//importing routes:
import userRouter from "./routes/user.routes.js"
//when someone accesses /users, the control is passed to the userRouter, which decides where to go next, user.routes.js.
app.use("/api/v1/users", userRouter);
//http://localhost:2000/api/v1/users/register

export { app }

