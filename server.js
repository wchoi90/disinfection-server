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
     * dialog 자동확인
     ********************************************/
    page.on("dialog", async dialog => {

      console.log(
        "팝업:",
        dialog.message()
      );

      await dialog.accept();

    });

    /********************************************
     * 로그인
     ********************************************/
    await page.goto(
      "https://eroumcare.com/bbs/login.php",
      {
        waitUntil: "networkidle"
      }
    );

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
     * 소독 페이지 이동
     ********************************************/
    await page.goto(
      "https://eroumcare.com/subrental/warehouse/disinfection.php",
      {
        waitUntil: "networkidle"
      }
    );

    /********************************************
     * 바코드 검색
     ********************************************/
    await page.fill(
      "#search_text",
      fullBarcode
    );

    await page.click(
      "#search_btn"
    );

    await page.waitForTimeout(3000);

    /********************************************
     * 상태 변수
     ********************************************/
    let isWaiting = false;
    let isProgress = false;

    /********************************************
     * 소독대기 확인
     ********************************************/
    await page.click(
      "#tab_disinfection_waiting"
    );

    await page.waitForTimeout(2000);

    const waitingNum =
      await page.locator(
        "#waitingNum"
      ).innerText();

    console.log({
      waitingNum
    });

    if (
      waitingNum.trim() === "1"
    ) {

      isWaiting = true;

      console.log(
        "소독대기 상태"
      );

    }

    /********************************************
     * 진행중 확인
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
     * 아무 상태도 아니면 종료
     ********************************************/
    if (
      !isWaiting &&
      !isProgress
    ) {

      await browser.close();

      return res.json({

        success: false,
        error: "바코드 없음"

      });

    }

    /********************************************
     * 소독대기 → 진행중
     ********************************************/
    if (isWaiting) {

      console.log(
        "소독대기 처리 시작"
      );

      await page.click(
        "#disinfection_item_list > tbody > tr > td.Tcenter > div > label",
        {
          force: true
        }
      );

      console.log(
        "소독대기 체크 완료"
      );

      await page.click(
        "#disinfection_order_btn"
      );

      console.log(
        "소독지시 버튼 클릭"
      );

      await page.waitForTimeout(2000);

      await page.click(
        "#order_submit"
      );

      console.log(
        "이동 버튼 클릭"
      );

      await page.waitForTimeout(5000);

      /******************************************
       * 진행중 탭
       ******************************************/
      await page.click(
        "#tab_disinfection_progress"
      );

      await page.waitForTimeout(3000);

      console.log(
        "소독진행중 탭 이동 완료"
      );

    }

    /********************************************
     * 진행중 → 완료
     ********************************************/
    console.log(
      "소독진행중 처리 시작"
    );

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

    await page.click(
      "#btn_disinfection_done"
    );

    console.log(
      "소독완료 버튼 클릭 완료"
    );

    /********************************************
     * 완료목록 생성 대기
     ********************************************/
    console.log(
      "완료목록 생성 대기 시작"
    );

    await page.waitForTimeout(5000);

    await page.waitForSelector(
      "#disinfection_item_fixed_list > tbody > tr",
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
      "#disinfection_item_fixed_list > tbody > tr > td.Tcenter > div > label",
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
      "#btn_move_rack",
      {
        force: true
      }
    );

    console.log(
      "창고이동 버튼 클릭"
    );

    await page.waitForTimeout(3000);

    /********************************************
     * 드롭다운 열기
     ********************************************/
    await page.click(
      "#sel_move_svwr_id .selected",
      {
        force: true
      }
    );

    console.log(
      "랙 드롭다운 열기"
    );

    await page.waitForTimeout(2000);

    /********************************************
     * 렉 선택
     ********************************************/
    await page.waitForSelector(
      "#sel_move_svwr_id .option.active ul li button",
      {
        timeout: 10000
      }
    );

    const rackButtons =
      await page.$$(
        "#sel_move_svwr_id .option.active ul li button"
      );

    let selected = false;

    for (const btn of rackButtons) {

      const available =
        await btn.getAttribute(
          "data-available"
        );

      const value =
        await btn.getAttribute(
          "value"
        );

      const text =
        await btn.innerText();

      console.log(
        "랙:",
        text,
        "available:",
        available
      );

      if (available === "1") {

        console.log(
          "선택시도:",
          text
        );

        await btn.click({
          force: true
        });

        await page.waitForTimeout(2000);

        console.log(
          "선택된 rack value:",
          value
        );

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
     * 이동 버튼
     ********************************************/
    console.log(
      "이동버튼 클릭 직전"
    );

    await page.click(
      "#move_rack_submit",
      {
        force: true
      }
    );

    console.log(
      "이동버튼 클릭 직후"
    );

    await page.waitForTimeout(5000);

    console.log(
      "전체 소독 프로세스 완료"
    );

    await browser.close();

    res.json({

      success: true,
      barcode: fullBarcode

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