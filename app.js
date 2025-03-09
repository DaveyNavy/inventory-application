const express = require("express");
const app = express();
const categoryRouter = require("./routes/categoryRouter");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use("/category", categoryRouter);

app.use("/", (req, res) => res.render("index"));

const PORT = process.env.PORT || 3000;
app.listen(PORT);
