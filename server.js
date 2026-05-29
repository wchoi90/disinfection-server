const express =
  require("express");

const {
  chromium
} =
  require("playwright");

const app =
  express();

app.use(
  express.json()
);

const PORT =
  process.env.PORT || 3000;

/****************************************
 * 전역브라우저
 ****************************************/
let browser;
let page;
let isLoggedIn = false;

/****************************************
 * 브라우저 시작
 ****************************************/
async function initBrowser(){

  console.log(
    "브라우저 시작"
  );

  browser =
    await chromium.launch({

      headless:true,

      args:[
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]

    });

  const context =
    await browser.newContext();

  page =
    await context.newPage();

}

/****************************************
 * 로그인 유지
 ****************************************/
async function login(loginId,loginPw){

  if(isLoggedIn){

    console.log(
      "이미 로그인됨"
    );

    return;

  }

  console.log(
    "로그인 시작"
  );

  await page.goto(

    "https://login.ecount.com/Login/#/Login",

    {
      waitUntil:"networkidle"
    }

  );

  await page.fill(
    "#userid",
    loginId
  );

  await page.fill(
    "#pwd",
    loginPw
  );

  await page.click(
    "#save"
  );

  await page.waitForTimeout(
    3000
  );

  isLoggedIn = true;

  console.log(
    "로그인 완료"
  );

}

/****************************************
 * 소독 API
 ****************************************/
app.post(
  "/disinfect",
  async(req,res)=>{

    try{

      const {

        loginId,
        loginPw,
        fullBarcode

      } = req.body;

      console.log(
        "요청 바코드:",
        fullBarcode
      );

      /********************************
       * 로그인 유지
       ********************************/
      await login(
        loginId,
        loginPw
      );

      /********************************
       * 실제 페이지 이동
       ********************************/
      await page.goto(

        "https://eroumcare.com/subrental/warehouse/disinfection.php",

        {
          waitUntil:"networkidle"
        }

      );

      /********************************
       * 바코드 입력
       ********************************/
      await page.fill(

        "input[type='text']",

        fullBarcode

      );

      /********************************
       * 엔터
       ********************************/
      await page.keyboard.press(
        "Enter"
      );

      /********************************
       * 처리대기
       ********************************/
      await page.waitForTimeout(
        2000
      );

      /********************************
       * 성공응답
       ********************************/
      res.json({

        success:true,

        barcode:
          fullBarcode

      });

    } catch(err){

      console.error(err);

      /********************************
       * 로그인 세션 초기화
       ********************************/
      isLoggedIn = false;

      res.status(500).json({

        success:false,

        message:
          err.toString()

      });

    }

  }

);

/****************************************
 * 서버시작
 ****************************************/
app.listen(
  PORT,
  async()=>{

    console.log(
      "서버 시작:",
      PORT
    );

    await initBrowser();

  }

);