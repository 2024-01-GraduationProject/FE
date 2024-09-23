import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Axios 인스턴스 import
import { debounce } from "lodash";
import boogiImage from "assets/img/boogi_main.png"; // 이미지 경로 import
import boogi1 from "assets/img/miniboogi1.png"; // 첫 번째 이미지 경로
import boogi2 from "assets/img/miniboogi2.png"; // 두 번째 이미지 경로
import boogi3 from "assets/img/miniboogi3.png"; // 세 번째 이미지 경로

const Intro = () => {
  const [introEmail, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [emailVisible, setEmailVisible] = useState(false); // 이메일 입력란 표시 여부 상태 추가
  const [scrollY, setScrollY] = useState(0); // 스크롤 위치 상태 추가
  const [showBalloon, setShowBalloon] = useState(false); // 말풍선 표시 상태 추가
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 이미지 인덱스 상태 추가
  const images = [boogi1, boogi2, boogi3];

  const navigate = useNavigate();

  // 이미지가 1초마다 바뀌는 함수
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 1000); // 1초마다 이미지 변경

    return () => clearInterval(interval);
  }, [images.length]);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const sections = document.querySelectorAll(".fade-section");
      sections.forEach((section) => {
        if (section.offsetTop <= window.scrollY + window.innerHeight - 200) {
          section.classList.add("fade-in");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 말풍선을 일정 시간 후에 나타나게 설정
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBalloon(true);
    }, 3000); // 3초 후에 말풍선 표시
    return () => clearTimeout(timer);
  }, []);

  const emailCheckHandler = debounce(async (email) => {
    const emailRegex =
      /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;

    if (email === "") {
      setEmailError("이메일을 입력해주세요.");
      setIsEmailAvailable(false);
    } else if (!emailRegex.test(email)) {
      setEmailError("이메일 형식으로 입력해주세요.");
      setIsEmailAvailable(false);
    } else {
      try {
        const response = await api.post(
          `${process.env.REACT_APP_SERVER_URL}/validate-email`,
          { email }
        );

        if (response.data.isDuplicate) {
          setEmailError("이미 사용 중인 이메일입니다.");
          setIsEmailAvailable(false);
        } else {
          setEmailError("사용 가능한 이메일입니다.");
          setIsEmailAvailable(true);
        }
      } catch (error) {
        console.error("Error checking email:", error);
        setEmailError(
          "이메일 중복 확인 중 오류가 발생했습니다. 관리자에게 문의해주세요."
        );
        setIsEmailAvailable(false);
      }
    }
  }, 300);

  const handleStartClick = () => {
    if (!emailVisible) {
      setEmailVisible(true);
    } else if (isEmailAvailable) {
      navigate("/join", { state: { value: introEmail } });
    } else {
      alert("유효한 이메일을 입력해주세요.");
    }
  };

  const onChangeEmail = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
    emailCheckHandler(emailValue);
  };

  return (
    <>
      <section
        id="intro"
        className="intro-section"
        style={{
          backgroundColor: scrollY > 100 ? "#ffeb3b" : "#fdfdf5",
          transition: "background-color 0.5s ease",
        }}
      >
        <div className="intro__text">
          <div className="text1">오래도록 책을 마음에 두고 싶다면?</div>
          <div className="text2">
            <span className="boogi_text1">부기</span> 와 함께 밀도있는 독서생활
          </div>
          <div className="text3">
            <span className="boogi_text1">AI 부기</span> 가 책에 대한 여러
            질문을 던져줍니다!
          </div>
        </div>

        {/* 이미지 컨테이너 */}
        <div className="intro__image-container">
          <img src={boogiImage} alt="Boogi Character" />
        </div>

        <form
          className="intro__start"
          onSubmit={(e) => {
            e.preventDefault();
            handleStartClick();
          }}
        >
          <div className="button-email-container">
            {emailVisible && (
              <div className="intro__input visible">
                <input
                  type="text"
                  placeholder="e-mail"
                  value={introEmail}
                  onChange={onChangeEmail}
                />
                {emailError && (
                  <div
                    className={`error-message ${
                      emailError === "사용 가능한 이메일입니다."
                        ? "success"
                        : ""
                    }`}
                  >
                    {emailError}
                  </div>
                )}
              </div>
            )}

            <button
              className={`start_btn ${
                emailVisible && !isEmailAvailable ? "inactive" : ""
              }`}
              type="button"
              onClick={handleStartClick}
            >
              첫 달 무료로 시작하기
            </button>
          </div>
        </form>

        {/* 말풍선 */}
        {showBalloon && (
          <div className="speech-balloon">이미 회원이신가요? 로그인하세요!</div>
        )}
      </section>

      {/* 묶인 섹션 */}
      <section
        className="fade-section combined-section"
        style={{
          backgroundColor: scrollY > 100 ? "#ffeb3b" : "#fffacd",
          transition: "background-color 0.5s ease",
        }}
      >
        <div className="section-box">
          <h2>전자책 도서관의 새로운 경험</h2>
          <p>
            책을 읽고 부기와의 대화를 통해 더욱 깊은 독서의 즐거움을 느껴보세요!
          </p>
          {/* 이미지 슬라이드 */}
          <div className="image-balloon-container">
            <img
              src={images[currentImageIndex]}
              alt="Boogi Character"
              className="sliding-image"
            />
            {/* 말풍선 */}
            <div className={`bubble-balloon ${showBalloon ? "show" : ""}`}>
              앨리스는 자꾸 크기도 커지고 작아지기도 하잖아.
              <br />
              너라면 어떤 순간에 작아지고 싶고, 어떤 순간에 커지고 싶어?
            </div>
          </div>
        </div>
        <div className="section-box">
          <h2>독서의 새로운 패러다임</h2>
          <p>
            다양한 도서를 자유롭게 탐색하고 여러분만의 독서 공간을 만드세요!
          </p>
        </div>
      </section>
    </>
  );
};

export default Intro;
