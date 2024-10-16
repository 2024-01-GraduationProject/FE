import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "assets/img/logo.png";
import api from "../../api";
import { useAuth } from "AuthContext";
import { SearchBar } from "components";

const Header2 = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await api.post("/logout");

      if (response.status === 200) {
        // 로그아웃 성공
        logout();
        // 페이지 이동
        navigate("/");
      } else {
        // 로그아웃 실패
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleSearchResults = (results) => {
    // 검색 결과를 SearchList 페이지로 전달
    navigate("/searchlist", { state: { searchResults: results } });
  };

  return (
    <header id="header2" role="banner">
      <div className="header__inner">
        <span
          className="header__logo"
          onClick={() => handleNavigate("/mainview")}
        >
          <img src={logo} alt="로고"></img>
        </span>

        <span>
          <SearchBar onSearch={handleSearchResults} />
        </span>

        <nav className="header__nav" role="navigation" aria-label="로그인 메뉴">
          <ul>
            <li>
              <button
                className="header2_btn"
                onClick={() => handleNavigate("/mypage")}
              >
                MY
              </button>
            </li>
            <span className="separator"> | </span>
            <li>
              <button className="header2_btn" onClick={handleLogout}>
                LOGOUT
              </button>
            </li>
          </ul>
        </nav>
      </div>
      {/*<hr />*/}
    </header>
  );
};

export default Header2;
