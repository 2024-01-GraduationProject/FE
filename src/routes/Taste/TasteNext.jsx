import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import boogi2 from "assets/img/boogi2.jpg";
import logo from "assets/img/logo.png";
import { useAuth } from "AuthContext";

const TasteNext = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // 인증되지 않은 경우 로그인 페이지로 이동
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // 로딩 중일 때 로딩 메시지 표시
  if (!isAuthenticated) {
    return <div>로딩 중...</div>;
  }

  return (
    <>
      <header id="header" role="banner">
        <div className="header__inner">
          <span className="header__logo" onClick={() => navigate("/")}>
            <img src={logo} alt="로고"></img>
          </span>
        </div>
        <hr />
      </header>
      <div id="tastenext">
        <img src={boogi2} alt="부기"></img>
        <div className="taste_text">
          <div>감사합니다!</div>
          <div>부기가 취향에 맞는 도서를 소개해드릴게요!</div>
        </div>

        <button className="move_home" onClick={() => navigate("/login")}>
          로그인하러 가기
        </button>
      </div>
    </>
  );
};

export default TasteNext;
