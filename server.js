const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.use(express.json());

/************************************************
 * 기본 테스트
 ************************************************/
app.get("/", (req, res) => {

  res.send("Server OK");

});

/************************************************
 * 소독 테스트
 ************************************************/
app.post("/disinfection", async (req, res) => {

  const {
    barcode,
    productName,
    user
  } = req.body;

  console.log(req.body);

  try {

    const browser =
      await chromium.launch({

        headless: true

      });

    const page =
      await browser.newPage();

    /********************************************
     * 로그인 페이지 이동
     ********************************************/
    await page.goto(
      "https://eroumcare.com/bbs/login.php"
    );

    /********************************************
     * 아이디 입력
     ********************************************/
    await page.fill(
      "#user-id",
      "cho"
    );

    /********************************************
     * 비밀번호 입력
     ********************************************/
    await page.fill(
      "#user-pass",
      "cho1234"
    );

    /********************************************
     * 로그인 버튼 클릭
     ********************************************/
    await page.click(
      ".btn_submit_01"
    );

    /********************************************
     * 로그인 완료 대기
     ********************************************/
    await page.waitForTimeout(3000);

    console.log("로그인 성공");

    await browser.close();

    res.json({

      success: true

    });

  } catch (e) {

    console.log(e);

    res.json({

      success: false,
      error: String(e)

    });

  }

});

/************************************************
 * 서버 시작
 ************************************************/
const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    "서버 실행중:",
    PORT
  );

});