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
 * 소독 처리
 ************************************************/
app.post("/disinfect", async (req, res) => {

  const {
    loginId,
    loginPw,
    fullBarcode
  } = req.body;

  console.log(req.body);

  let browser;

  try {

    /********************************************
     * 브라우저 실행
     ********************************************/
    browser =
      await chromium.launch({

        headless: true

      });

    const page =
      await browser.newPage();

    /********************************************
     * 로그인 페이지 이동
     ********************************************/
    await page.goto(
      "https://eroumcare.com/bbs/login.php",
      {
        waitUntil: "networkidle"
      }
    );

    /********************************************
     * 아이디 입력
     ********************************************/
    await page.fill(
      "#user-id",
      loginId
    );

    /********************************************
     * 비밀번호 입력
     ********************************************/
    await page.fill(
      "#user-pass",
      loginPw
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

    /********************************************
     * 소독지시 페이지 이동
     ********************************************/
    await page.goto(
      "https://eroumcare.com/subrental/warehouse/disinfection.php",
      {
        waitUntil: "networkidle"
      }
    );

    /********************************************
     * 검색창 입력
     ********************************************/
    await page.fill(
      "#search_text",
      fullBarcode
    );

    /********************************************
     * 검색 버튼 클릭
     ********************************************/
    await page.click(
      "#search_btn"
    );

    /********************************************
     * 검색 결과 대기
     ********************************************/
    await page.waitForTimeout(3000);

    /********************************************
     * 소독대기 탭 클릭
     ********************************************/
    await page.click(
      "#tab_disinfection_waiting"
    );

    await page.waitForTimeout(2000);

    /********************************************
     * waitingNum 확인
     ********************************************/
    const waitingNum =
      await page.locator(
        "#waitingNum"
      ).innerText();

    console.log(
      "waitingNum:",
      waitingNum
    );

    /********************************************
     * 브라우저 종료
     ********************************************/
    await browser.close();

    /********************************************
     * 결과 반환
     ********************************************/
    res.json({

      success: true,

      waitingNum: waitingNum

    });

  } catch (e) {

    console.log(e);

    if (browser) {

      await browser.close();

    }

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