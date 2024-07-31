import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import postRoutes from './routes/posts.js'
import userRoutes from "./routes/user.js"
import dotenv from "dotenv";

const app = express();

dotenv.config()

const corsOptions = {
  origin: 'http://localhost:5000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.use(bodyParser.json({ limit: "30mb", extended: true }));

app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));


app.use('/posts', postRoutes)
app.use('/user', userRoutes)


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })

  .then(() => app.listen(PORT, () => console.log(`Server is Running on ${PORT}`)))

  .catch((error) => console.log(error.message));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!' });
});