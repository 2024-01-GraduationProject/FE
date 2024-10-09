import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Header2,
  MainNav,
  NewBook,
  BestBook,
  FamousBook,
  RecommendBook,
} from "components";
import { useAuth } from "AuthContext";

const MainView = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  {
    /*useEffect(() => {
    // 인증 상태가 false이면 로그인 페이지로 리디렉션
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <div>로딩 중...</div>; // 로딩 중 메시지 표시
  } */
  }

  return (
    <>
      <Header2 />
      <div className="container">
        <MainNav />

        <div className="mainview_content">
          <div className="mainview_wrapper">
            <BestBook />
          </div>

          <div className="mainview_wrapper">
            <RecommendBook />
          </div>

          <div className="mainview_wrapper">
            <hr className="mainview_line" />
            <NewBook />
          </div>

          <div className="mainview_wrapper">
            <hr className="mainview_line" />
            <FamousBook />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainView;
