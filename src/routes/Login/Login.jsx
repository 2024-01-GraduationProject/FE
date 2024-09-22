import React, { useState, useRef } from "react";
import logo from "assets/img/logo.png";

import { useNavigate } from "react-router-dom";

import api from "../../api";
import { useAuth } from "AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginCheck, setLoginCheck] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const onEmailHandler = (e) => {
    setEmail(e.target.value);
  };

  const onPasswordHandler = (e) => {
    setPassword(e.target.value);
  };

  // 로그인 요청 핸들러
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        `${process.env.REACT_APP_API_URL}/login`,
        {
          email: email,
          password: password,
        }
      );

      if (response.status === 200) {
        // 로그인 성공 시
        setLoginCheck(false);
        const { token } = response.data;
        localStorage.setItem("authToken", token);
        // AuthContext의 login 함수 호출
        await login(token);
        navigate("/mainview");
      } else {
        // 로그인 실패 시
        setLoginCheck(true);
      }
    } catch (error) {
      console.error("로그인 중 오류가 발생했습니다:", error);
      setLoginCheck(true);
    }
  };

  return (
    <>
      <div id="login">
        <span>
          <img
            src={logo}
            alt="로고"
            className="logo"
            onClick={() => navigate("/")}
          />
        </span>
        <div>
          <form className="login_form" onSubmit={handleLogin}>
            <div>
              <div className="login_input">
                <input
                  className="login_email"
                  type="email"
                  placeholder="사용자 이메일"
                  value={email}
                  onChange={onEmailHandler}
                  autoFocus
                  required // 이메일 비어있으면 안 됨.
                />
                <input
                  className="login_pw"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={onPasswordHandler}
                  required // 비밀번호 비어있으면 안 됨.
                />
                <div className={`login_check ${loginCheck ? "visible" : ""}`}>
                  {loginCheck && (
                    <small>이메일 혹은 비밀번호를 확인해주세요.</small>
                  )}
                </div>
              </div>
            </div>

            <div>
              <button type="submit" className="login_btn">
                로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
