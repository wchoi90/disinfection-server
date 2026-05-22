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
     * 로그인
     ********************************************/
    await page.fill(
      "#user-id",
      loginId
    );

    await page.fill(
      "#user-pass",
      loginPw
    );

    await page.click(
      ".btn_submit_01"
    );

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
     * 바코드 입력
     ********************************************/
    await page.fill(
      "#search_text",
      fullBarcode
    );

    /********************************************
     * 검색 버튼
     ********************************************/
    await page.click(
      "#search_btn"
    );

    await page.waitForTimeout(3000);

    /********************************************
     * 소독대기 탭
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

    console.log({
      waitingNum
    });

    /********************************************
     * 소독대기 상태 여부
     ********************************************/
    let isWaiting =
      waitingNum.trim() === "1";

    let isProgress =
      false;

    /********************************************
     * 소독대기 없으면 진행중 확인
     ********************************************/
    if (!isWaiting) {

      await page.click(
        "#tab_disinfection_progress"
      );

      await page.waitForTimeout(3000);

      const progressNum =
        await page.locator(
          "#progressNum"
        ).innerText();

      console.log({
        progressNum
      });

      if (
        progressNum.trim() === "1"
      ) {

        isProgress = true;

        console.log(
          "이미 소독진행중 상태"
        );

      }

    }

    /********************************************
     * 둘다 아니면 종료
     ********************************************/
    if (
      !isWaiting &&
      !isProgress
    ) {

      await browser.close();

      return res.json({

        success: true,
        waitingNum

      });

    }

    /********************************************
     * 소독대기 처리
     ********************************************/
    if (isWaiting) {

      console.log(
        "소독대기 처리 시작"
      );

      /******************************************
       * 체크
       ******************************************/
      await page.click(
        "#disinfection_item_list > tbody > tr > td.Tcenter > div > label",
        {
          force: true
        }
      );

      console.log(
        "소독대기 체크 완료"
      );

      /******************************************
       * 소독지시 버튼
       ******************************************/
      await page.click(
        "#disinfection_order_btn"
      );

      console.log(
        "소독지시 버튼 클릭"
      );

      await page.waitForTimeout(2000);

      /******************************************
       * 이동 버튼
       ******************************************/
      await page.click(
        "#order_submit"
      );

      console.log(
        "이동 버튼 클릭"
      );

      await page.waitForTimeout(5000);

      /******************************************
       * 소독진행중 탭
       ******************************************/
      await page.click(
        "#tab_disinfection_progress"
      );

      console.log(
        "소독진행중 탭 클릭"
      );

      await page.waitForTimeout(3000);

    }

    /********************************************
     * 소독진행중 처리
     ********************************************/
    console.log(
      "소독진행중 처리 시작"
    );

    /********************************************
     * 진행중 체크
     ********************************************/
    await page.click(
      "#disinfection_item_list > tbody > tr > td.Tcenter > div > label",
      {
        force: true
      }
    );

    console.log(
      "소독진행중 체크 완료"
    );

    await page.waitForTimeout(2000);

    /********************************************
     * 소독완료 버튼
     ********************************************/
    console.log(
      "소독완료 버튼 클릭 시작"
    );

    await page.click(
      "#btn_disinfection_done"
    );

    console.log(
      "소독완료 버튼 클릭 완료"
    );

    await page.waitForTimeout(5000);

    console.log(
      "5초 대기 완료"
    );

    /********************************************
     * 완료목록 생성 대기
     ********************************************/
    console.log(
      "완료목록 대기 시작"
    );

    await page.waitForSelector(
      "#disinfection_item_fixed_list > tbody > tr:nth-child(1) > td.Tcenter > div > label",
      {
        timeout: 30000
      }
    );

    console.log(
      "완료목록 생성 완료"
    );

    /********************************************
     * 완료목록 체크
     ********************************************/
    await page.click(
      "#disinfection_item_fixed_list > tbody > tr:nth-child(1) > td.Tcenter > div > label",
      {
        force: true
      }
    );

    console.log(
      "완료목록 체크 완료"
    );

    /********************************************
     * 창고이동 버튼
     ********************************************/
    await page.click(
      "#btn_move_rack"
    );

    console.log(
      "창고이동 버튼 클릭"
    );

    await page.waitForTimeout(3000);

    /********************************************
     * 렉 선택
     ********************************************/
    const rackButtons =
      await page.$$(
        "#sel_move_svwr_id ul li button"
      );

    let selected = false;

    for (const btn of rackButtons) {

      const text =
        await btn.innerText();

      console.log(text);

      if (
        !text.includes("사용가능: 0")
      ) {

        await btn.click();

        selected = true;

        console.log(
          "렉 선택 완료"
        );

        break;

      }

    }

    /********************************************
     * 렉 없으면 종료
     ********************************************/
    if (!selected) {

      await browser.close();

      return res.json({

        success: false,
        error: "사용가능 렉 없음"

      });

    }

    /********************************************
     * 이동 실행
     ********************************************/
    await page.click(
      "#move_rack_submit"
    );

    console.log(
      "창고이동 완료"
    );

    await page.waitForTimeout(5000);

    /********************************************
     * 브라우저 종료
     ********************************************/
    await browser.close();

    console.log(
      "전체 소독 프로세스 완료"
    );

    /********************************************
     * 성공 반환
     ********************************************/
    res.json({

      success: true,
      waitingNum

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
  process.env.PORT || 8080;

app.listen(PORT, () => {

  console.log(
    "서버 실행중:",
    PORT
  );

});