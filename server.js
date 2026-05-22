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

  try {

    /********************************************
     * 브라우저 실행
     ********************************************/
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

    /********************************************
     * 로그인 대기
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
     * 바코드 입력
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
     * 검색 대기
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

    console.log({
      waitingNum
    });

    /********************************************
     * 대상 없으면 종료
     ********************************************/
    if (waitingNum.trim() !== "1") {

      await browser.close();

      return res.json({

        success: true,
        waitingNum

      });

    }

    /********************************************
     * 소독대기 체크
     ********************************************/
    await page.click(
      "#disinfection_item_list > tbody > tr > td.Tcenter > div > label",
      {
        force: true
      }
    );

    /********************************************
     * 소독지시 버튼
     ********************************************/
    await page.click(
      "#disinfection_order_btn"
    );

    /********************************************
     * 팝업 대기
     ********************************************/
    await page.waitForTimeout(2000);

    /********************************************
     * 이동 버튼
     ********************************************/
    await page.click(
      "#order_submit"
    );

    /********************************************
     * 처리 대기
     ********************************************/
    await page.waitForTimeout(3000);

    /********************************************
     * 소독진행중 탭
     ********************************************/
    await page.click(
      "#tab_disinfection_progress"
    );

    await page.waitForTimeout(2000);

    /********************************************
     * 진행중 체크
     ********************************************/
    await page.click(
      "#disinfection_item_list > tbody > tr > td.Tcenter > div > label",
      {
        force: true
      }
    );

    /********************************************
     * 소독완료 버튼
     ********************************************/
    await page.click(
      "#btn_disinfection_done"
    );

    /********************************************
     * 완료목록 생성 대기
     ********************************************/
    await page.waitForSelector(
      "#disinfection_item_fixed_list > tbody > tr:nth-child(1) > td.Tcenter > div > label",
      {
        timeout: 30000
      }
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

    /********************************************
     * 창고이동 버튼
     ********************************************/
    await page.click(
      "#btn_move_rack"
    );

    await page.waitForTimeout(3000);

    /********************************************
     * 렉 버튼 찾기
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
     * 렉 없으면 실패
     ********************************************/
    if (!selected) {

      await browser.close();

      return res.json({

        success: false,
        error: "사용가능 렉 없음"

      });

    }

    /********************************************
     * 이동 버튼 클릭
     ********************************************/
    await page.click(
      "#move_rack_submit"
    );

    /********************************************
     * 완료 대기
     ********************************************/
    await page.waitForTimeout(5000);

    console.log(
      "소독 완료"
    );

    /********************************************
     * 브라우저 종료
     ********************************************/
    await browser.close();

    /********************************************
     * 성공 반환
     ********************************************/
    res.json({

      success: true,
      waitingNum

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