const express = require("express")
const route = require("./routes/route")

const mongoose = require('mongoose')
// require("dotenv").config()
const app = express();

mongoose.set('strictQuery', true);
app.use(express.json());

mongoose.connect("mongodb+srv://yachika03:wkaTIq3zkjIou3YI@cluster0.t9qdtvx.mongodb.net/group37Database",
    {
        useNewUrlParser: true

    }).then(() => console.log("MongoDB is connected"))
    .catch((err) => console.log(err))

app.use('/', route)


app.listen(process.env.PORT || 3000, function () {
    console.log("Express app running on port " + (process.env.PORT || 3000))
})


app.use("/*", function (req, res) {
    return res.status(400).send({ status: false, message: "invalid request params (path not found)" })
});


