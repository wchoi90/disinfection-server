const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {

  res.send("Server OK");

});

app.post("/disinfection", async (req, res) => {

  console.log("받은 데이터:");
  console.log(req.body);

  res.json({

    success: true

  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("서버 실행중:", PORT);

});