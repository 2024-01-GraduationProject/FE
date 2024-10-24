import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "assets/img/logo.png";

const Header = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <header id="header" role="banner">
      <div className="header__inner">
        <span className="header__logo" onClick={() => handleNavigate("/")}>
          <img src={logo} alt="로고"></img>
        </span>
        <nav className="header__nav" role="navigation" aria-label="로그인 메뉴">
          <ul>
            <li>
              <button
                className="login_btn"
                onClick={() => handleNavigate("/login")}
              >
                Login
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <hr />
    </header>
  );
};

export default Header;
