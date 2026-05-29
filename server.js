const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.use(express.json());

/************************************************
 * 전역 변수
 ************************************************/
let browser;
let page;
let isLoggedIn = false;
let isProcessing = false;

/************************************************
 * 브라우저 초기화
 ************************************************/
async function initBrowser() {

  console.log(
    "브라우저 시작"
  );

  browser =
    await chromium.launch({

      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]

    });

  page =
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

}

/************************************************
 * 로그인 유지
 ************************************************/
async function ensureLogin(
  loginId,
  loginPw
) {

  if (isLoggedIn) {

    console.log(
      "이미 로그인 상태"
    );

    return;

  }

  console.log(
    "로그인 시작"
  );

  await page.goto(
    "https://eroumcare.com/bbs/login.php",
    {
      waitUntil: "domcontentloaded"
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

  /********************************************
   * 로그인 완료 대기
   ********************************************/
  await page.waitForTimeout(1000);

  console.log(
    "로그인 성공"
  );

  isLoggedIn = true;

}

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

  /********************************************
   * 동시실행 방지
   ********************************************/
  if (isProcessing) {

    return res.json({

      success: false,
      error: "다른 작업 처리중"

    });

  }

  isProcessing = true;

  const {
    loginId,
    loginPw,
    fullBarcode
  } = req.body;

  console.log(
    "요청:",
    fullBarcode
  );

  try {

    /********************************************
     * 로그인 유지
     ********************************************/
    await ensureLogin(
      loginId,
      loginPw
    );

    /********************************************
     * 소독 페이지 이동
     ********************************************/
    await page.goto(
      "https://eroumcare.com/subrental/warehouse/disinfection.php",
      {
        waitUntil: "domcontentloaded"
      }
    );

    /********************************************
     * 기존 검색값 제거
     ********************************************/
    await page.fill(
      "#search_text",
      ""
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

    /********************************************
     * 최소 대기
     ********************************************/
    await page.waitForTimeout(700);

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

    await page.waitForTimeout(500);

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
     * 소독진행중 확인
     ********************************************/
    if (!isWaiting) {

      await page.click(
        "#tab_disinfection_progress"
      );

      await page.waitForTimeout(500);

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
     * 둘다 아니면 즉시 종료
     ********************************************/
    if (
      !isWaiting &&
      !isProgress
    ) {

      console.log(
        "바코드 없음 종료"
      );

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
        "소독대기 처리"
      );

      await page.click(
        "#disinfection_item_list > tbody > tr > td.Tcenter > div > label",
        {
          force: true
        }
      );

      await page.click(
        "#disinfection_order_btn"
      );

      await page.waitForTimeout(500);

      await page.click(
        "#order_submit"
      );

      await page.waitForTimeout(1000);

      /******************************************
       * 진행중 탭 이동
       ******************************************/
      await page.click(
        "#tab_disinfection_progress"
      );

      await page.waitForTimeout(700);

    }

    /********************************************
     * 소독진행중 → 완료
     ********************************************/
    console.log(
      "소독완료 처리"
    );

    await page.click(
      "#disinfection_item_list > tbody > tr > td.Tcenter > div > label",
      {
        force: true
      }
    );

    await page.waitForTimeout(300);

    await page.click(
      "#btn_disinfection_done"
    );

    /********************************************
     * 완료목록 생성
     ********************************************/
    await page.waitForSelector(
      "#disinfection_item_fixed_list > tbody > tr",
      {
        timeout: 5000
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

    /********************************************
     * 창고이동 버튼
     ********************************************/
    await page.click(
      "#btn_move_rack",
      {
        force: true
      }
    );

    await page.waitForTimeout(700);

    /********************************************
     * 렉 버튼 대기
     ********************************************/
    await page.waitForSelector(
      "#sel_move_svwr_id button",
      {
        timeout: 5000
      }
    );

    /********************************************
     * 렉 버튼 목록
     ********************************************/
    const rackButtons =
      await page.$$(
        "#sel_move_svwr_id button"
      );

    let selected = false;

    /********************************************
     * 사용가능 렉 선택
     ********************************************/
    for (const btn of rackButtons) {

      const available =
        await btn.getAttribute(
          "data-available"
        );

      const text =
        await btn.innerText();

      console.log(
        "랙:",
        text,
        "available:",
        available
      );

      if (
        available &&
        Number(available) > 0
      ) {

        await page.evaluate(
          el => el.click(),
          btn
        );

        selected = true;

        console.log(
          "렉 선택 완료"
        );

        break;

      }

    }

    /********************************************
     * 사용가능 렉 없음
     ********************************************/
    if (!selected) {

      return res.json({

        success: false,
        error: "사용가능 렉 없음"

      });

    }

    /********************************************
     * 이동 버튼 클릭
     ********************************************/
    await page.click(
      "#move_rack_submit",
      {
        force: true
      }
    );

    await page.waitForTimeout(1000);

    console.log(
      "전체 프로세스 완료"
    );

    return res.json({

      success: true,
      barcode: fullBarcode

    });

  } catch (e) {

    console.log(e);

    /********************************************
     * 로그인상태 초기화
     ********************************************/
    isLoggedIn = false;

    return res.json({

      success: false,
      error: String(e)

    });

  } finally {

    /********************************************
     * 작업잠금 해제
     ********************************************/
    isProcessing = false;

  }

});

/************************************************
 * 서버 시작
 ************************************************/
const PORT =
  process.env.PORT || 8080;

app.listen(PORT, async () => {

  console.log(
    "서버 실행중:",
    PORT
  );

  await initBrowser();

});