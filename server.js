//import
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbmessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1069047",
  key: "edd94cd42f2921e39b26",
  secret: "1525e2289e05b5038b5d",
  cluster: "ap2",
  encrypted: true,
});

//miderwere
app.use(express.json());
app.use(cors());
//db
const connectUrl =
  "mongodb+srv://admin:BbjQ3H0AjPF62e4l@cluster0.pudhr.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connectUrl, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("db connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("chnaged occurred", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggered pusher");
    }
  });
});

//api routes
app.get("/", (req, res) => res.status(200).send("Welcom to whatsapp api"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(`new message created: \n ${data}`);
    }
  });
});

//listen
app.listen(port, () => console.log(`listning post ${port}`));

//password-BbjQ3H0AjPF62e4l
