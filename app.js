const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const port = process.env.PORT || 8000;
const db = require("./config/mongoose");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//third party API (Dummy API)
app.post("/api.msg91.com/api/v5/flow/", (req, res) => {
  return res.status(200).send({ status: "submitted" });
});

app.post("/api.sendgrid.com/v3/mail/send", (req, res) => {
  return res.status(200).send({ status: "submitted" });
});

app.listen(port, (err) => {
  if (err) {
    console.log("Error in connecting the server : " + err);
    return;
  }
  console.log(`Server is up and running on port ${port}`);
});

module.exports = app;
