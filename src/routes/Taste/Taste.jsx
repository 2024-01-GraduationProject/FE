import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "assets/img/logo.png";
import api from "../../api"; // Axios 인스턴스 import
import { useAuth } from "AuthContext";

const Taste = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Join에서 이메일 값 받아오기
  const location = useLocation();
  const { email, password } = location.state || {};

  const [selectedBookTastes, setSelectedBookTastes] = useState([]); // 선택된 분위기 저장
  const [selectedAge, setSelectedAge] = useState(""); // 선택된 연령 저장
  const [selectedGender, setSelectedGender] = useState(""); // 선택된 성별 저장
  const [isButtonEnabled, setIsButtonEnabled] = useState(false); // 버튼 활성화 상태

  const [ageOptions, setAgeOptions] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [bookCategoryOptions, setBookCategoryOptions] = useState([]);

  useEffect(() => {
    // 인증되지 않은 사용자가 접근할 수 없도록 리디렉션
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // 연령 데이터 가져오기
    const fetchAges = async () => {
      try {
        const response = await api.get(
          `${process.env.REACT_APP_SERVER_URL}/ages`
        );
        setAgeOptions(response.data);
      } catch (error) {
        console.log("연령 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    };

    // 성별 데이터 가져오기
    const fetchGenders = async () => {
      try {
        const response = await api.get(
          `${process.env.REACT_APP_SERVER_URL}/genders`
        );
        setGenderOptions(response.data);
      } catch (error) {
        console.log("성별 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    };

    // 취향 데이터 가져오기
    const fetchBookCategory = async () => {
      try {
        const response = await api.get(
          `${process.env.REACT_APP_SERVER_URL}/categories`
        );
        console.log("bookCategory options:", response.data);
        setBookCategoryOptions(response.data);
      } catch (error) {
        console.log("취향 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    };

    fetchAges();
    fetchGenders();
    fetchBookCategory();
  }, []);

  // 모든 선택이 완료되면 버튼을 활성화
  useEffect(() => {
    if (selectedAge && selectedGender && selectedBookTastes.length > 0) {
      setIsButtonEnabled(true);
    } else {
      setIsButtonEnabled(false);
    }
  }, [selectedAge, selectedGender, selectedBookTastes]);

  // 분위기 버튼 클릭 핸들러
  const handleBookTasteClick = (title) => {
    if (selectedBookTastes.includes(title)) {
      setSelectedBookTastes(
        selectedBookTastes.filter((taste) => taste !== title)
      );
    } else {
      setSelectedBookTastes([...selectedBookTastes, title]);
    }
  };

  // 연령 선택 핸들러
  const handleAgeChange = (e) => {
    setSelectedAge(e.target.value); // 선택된 연령으로 설정
  };

  // 성별 선택 핸들러
  const handleGenderChange = (e) => {
    setSelectedGender(e.target.value); // 선택된 성별로 설정
  };

  const handleTasteSubmit = async () => {
    if (!isButtonEnabled) return; // 버튼이 비활성화일 때는 실행하지 않음

    try {
      const response = await api.post(
        `${process.env.REACT_APP_SERVER_URL}/save-taste`,
        {
          email,
          age: selectedAge,
          gender: selectedGender,
          bookTaste: selectedBookTastes,
        }
      );
      if (response.status === 200) {
        navigate("/tastenext", { state: { email, password } });
      } else {
        alert(`서버로 데이터 전송 실패: ${response.data.message}`);
      }
    } catch (error) {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

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
      <div id="taste">
        <div className="taste_text">
          <span className="highlight">여러분의 독서 취향을 알려주세요!</span>
        </div>
        <div className="select_taste">
          <div className="age-gender-container">
            <div>
              연령
              <div className="custom-dropdown">
                <select
                  className="styled-select"
                  onChange={handleAgeChange}
                  value={selectedAge}
                >
                  <option value="" disabled>
                    연령 선택
                  </option>
                  {ageOptions.map((age) => (
                    <option key={age.age_id} value={age.age}>
                      {age.age}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              성별
              <div className="custom-dropdown">
                <select
                  className="styled-select"
                  onChange={handleGenderChange}
                  value={selectedGender}
                >
                  <option value="" disabled>
                    성별 선택
                  </option>
                  {genderOptions.map((gender) => (
                    <option key={gender.gender_id} value={gender.gender}>
                      {gender.gender}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mood">
          <div>취향(카테고리)</div>
          {bookCategoryOptions.length > 0 ? (
            bookCategoryOptions.map((taste) => (
              <button
                key={taste.category_id}
                className={
                  selectedBookTastes.includes(taste.category) ? "selected" : ""
                }
                onClick={() => handleBookTasteClick(taste.category)}
              >
                #{taste.category}
              </button>
            ))
          ) : (
            <div>취향 옵션을 불러오는 중...</div>
          )}
        </div>

        <div>
          <button
            className={`nextbtn ${isButtonEnabled ? "" : "disabled"}`}
            onClick={handleTasteSubmit}
            disabled={!isButtonEnabled}
          >
            다음 단계
          </button>
        </div>
      </div>
    </>
  );
};

export default Taste;
