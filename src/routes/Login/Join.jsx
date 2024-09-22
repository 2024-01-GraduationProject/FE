import React, { useState, useEffect } from "react";
import logo from "assets/img/logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api"; // Axios 인스턴스 import
import { useAuth } from "AuthContext";

const Join = () => {
  const navigate = useNavigate();
  // Intro에서 입력한 이메일 값 받아오기
  const { state } = useLocation();
  const initialEmail = state?.value || ""; // 값 가져오지 못했을 때를 대비
  const { login } = useAuth();

  // 상태 변수 설정
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  const [allAgreed, setAllAgreed] = useState(false);
  const [agreements, setAgreements] = useState({
    personalInfo: false,
    eventAlarm: false,
  });
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  // 버튼 활성화 여부 결정
  useEffect(() => {
    const isPasswordValid = passwordError === "";
    const isNicknameValid = isNicknameAvailable;
    const isAgreementValid = agreements.personalInfo;

    setIsButtonEnabled(isPasswordValid && isNicknameValid && isAgreementValid);
  }, [passwordError, isNicknameAvailable, agreements]);

  // onChangeHandler - 사용자가 input 값 입력할 때마다 변화 감지 및 업데이트
  const onChangePwHandler = (e) => {
    const value = e.target.value.replace(/\s/g, ""); // 공백 제거

    setPassword(value);
    passwordCheckHandler(value);
  };

  // 닉네임 변경 핸들러
  const onChangeNicknameHandler = (e) => {
    const nicknameValue = e.target.value.replace(/\s/g, ""); // 공백 제거
    setNickname(nicknameValue);
    nicknameCheckHandler(nicknameValue);
  };

  // 패스워드 input에서 공백 입력하면 기호 보이지 않도록 설정
  const handlePasswordInput = (e) => {
    if (e.inputType === "insertText" && e.data === " ") {
      e.preventDefault();
    }
  };

  // 패스워드 유효성 검사 핸들러
  const passwordCheckHandler = (password) => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[!@$&-_])(?=.*[0-9]).{8,16}$/;
    if (password === "") {
      setPasswordError("비밀번호를 입력해주세요.");
      return false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError(
        "비밀번호는 8~16자리 영문 대소문자 + 숫자 + ! @ $ & - _ 조합으로 입력해주세요."
      );
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  // 닉네임 유효성, 중복 검사 핸들러
  const nicknameCheckHandler = async (nickname) => {
    if (nickname === "") {
      setNicknameError("닉네임을 입력해주세요.");
      setIsNicknameAvailable(false);
    } else {
      // 닉네임 중복 확인 API 호출
      try {
        const response = await api.post(
          `${process.env.REACT_APP_API_URL}/validate-nickname`,
          { nickname }
        );

        if (response.data.isDuplicate) {
          setNicknameError("이미 사용 중인 닉네임입니다.");
          setIsNicknameAvailable(false);
        } else {
          setNicknameError("사용 가능한 닉네임입니다.");
          setIsNicknameAvailable(true);
        }
      } catch (error) {
        setNicknameError(
          "닉네임 중복 확인 중 오류가 발생했습니다. 관리자에게 문의해주세요."
        );
        setIsNicknameAvailable(false);
      }
    }
  };

  // 이용약관 체크 핸들러
  const handleAgreementChange = (e) => {
    const { name, checked } = e.target;

    setAgreements((prev) => ({ ...prev, [name]: checked }));
    const allChecked = Object.values({ ...agreements, [name]: checked }).every(
      (value) => value
    );
    setAllAgreed(allChecked);
  };

  // 전체 동의 핸들러
  const handleAllAgreementChange = (e) => {
    const { checked } = e.target;
    setAgreements((prev) =>
      Object.keys(prev).reduce(
        (newAgreements, key) => ({
          ...newAgreements,
          [key]: checked,
        }),
        {}
      )
    );
    setAllAgreed(checked);
  };

  // 회원가입 요청 핸들러
  const handleJoinSubmit = async (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    if (!isNicknameAvailable) {
      setNicknameError("닉네임을 확인해주세요.");
      return;
    }

    if (!agreements.personalInfo) {
      alert("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }

    if (passwordCheckHandler(password)) {
      try {
        const response = await api.post(
          `${process.env.REACT_APP_API_URL}/register`,
          {
            email,
            password,
            nickname,
            agreements,
          }
        );
        if (response.status === 200) {
          const { token } = response.data; // 회원가입 시 토큰이 반환된다고 가정
          localStorage.setItem("authToken", token); // 토큰 저장
          login(token);
          alert("회원가입이 완료되었습니다.");
          navigate("/taste", { state: { email, password } });
        } else {
          const errorData = response.data;
          alert(`회원가입 실패: ${errorData.message}`);
        }
      } catch (error) {
        alert("회원가입 중 오류가 발생했습니다.");
      }
    } else {
      setPasswordError("비밀번호를 확인해주세요.");
    }
  };

  return (
    <>
      <div id="join">
        <span onClick={() => navigate("/")}>
          <img src={logo} alt="로고"></img>
        </span>

        <form className="join_form" onSubmit={handleJoinSubmit}>
          <div>
            <div className="join_input">
              <input
                className="join_email"
                type="email"
                name="email"
                value={email}
                readOnly
                placeholder="사용자 이메일"
              />
              {emailError && (
                <small className="emailAvailable">* {emailError}</small>
              )}
              <input
                onChange={onChangePwHandler}
                onInput={handlePasswordInput}
                className="join_pw"
                type="password"
                name="password"
                value={password}
                placeholder="비밀번호"
                autoFocus
              />
              {passwordError && <small>* {passwordError}</small>}
              <input
                onChange={onChangeNicknameHandler}
                className="join_nickname"
                type="text"
                name="nickname"
                value={nickname}
                placeholder="사용할 닉네임"
              ></input>
              {nicknameError && (
                <small
                  className={isNicknameAvailable ? "NicknameAvailable" : ""}
                >
                  * {nicknameError}
                </small>
              )}
            </div>
          </div>

          <div className="check_agree">
            <ul>
              <li>
                <input
                  type="checkbox"
                  id="agree_check_info"
                  name="personalInfo"
                  required
                  checked={agreements.personalInfo}
                  onChange={handleAgreementChange}
                />
                <label htmlFor="agree_check_info">
                  <span>[필수] </span>개인정보 이용 수집 방침
                </label>
              </li>

              <li>
                <input
                  type="checkbox"
                  id="agree_check_event_receive"
                  name="eventAlarm"
                  checked={agreements.eventAlarm}
                  onChange={handleAgreementChange}
                />
                <label htmlFor="agree_check_event_receive">
                  <span>[선택] </span> 이벤트 및 혜택 알림 수신 동의
                </label>
              </li>

              <li>
                <input
                  type="checkbox"
                  id="agree_check_all"
                  name="agree_check_all"
                  checked={allAgreed}
                  onChange={handleAllAgreementChange}
                />
                <label htmlFor="agree_check_all">이용약관 전체동의</label>
              </li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              className={isButtonEnabled ? "active_btn" : "agree_btn"}
              disabled={!isButtonEnabled}
            >
              동의하고 계속
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Join;
