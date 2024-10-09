import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api"; // Axios 인스턴스 import

const MainNav = () => {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  // 새로 추가
  const [nickname, setNickname] = useState("");
  const [monthlyReading, setMonthlyReading] = useState({
    month: 0,
    readingCount: 0,
  });
  const navigate = useNavigate();
  const location = useLocation(); // 현재 경로 감지

  useEffect(() => {
    // 책 카테고리 데이터 가져오기
    const fetchCategories = async () => {
      try {
        const response = await api.get(`/categories`);
        setCategoryOptions(response.data);
      } catch (error) {
        console.log("책 카테고리를 가져오는 중 오류가 발생했습니다.");
      }
    };

    fetchCategories();
  }, []);

  // 사용자 닉네임과 월별 독서량 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 닉네임 가져오기
        const nicknameResponse = await api.get(`/user-nickname`);
        setNickname(nicknameResponse.data.nickname);

        // 이 달의 독서량 가져오기
        const readingResponse = await api.get(`/monthlyReading`);
        setMonthlyReading(readingResponse.data);
      } catch (error) {
        console.log("사용자 정보를 가져오는 중 오류가 발생했습니다.");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // 현재 경로에서 카테고리 추출하여 selectedCategory 업데이트
    const currentCategory = decodeURIComponent(
      location.pathname.split("/books/category/")[1] || ""
    );
    setSelectedCategory(currentCategory || null);
  }, [location]);

  const getLinkPath = (category) => {
    // category 값이 undefined일 경우 빈 문자열을 반환
    if (!category) return "/";
    // 한글 카테고리 이름을 URL에 사용하도록 변경
    return `/books/category/${encodeURIComponent(category)}`; // 한글을 안전하게 인코딩
  };

  const handleCategoryButtonClick = (category) => {
    setSelectedCategory(category);

    navigate(getLinkPath(category));
  };

  return (
    <>
      <div className="main_nav">
        {/* 내 서재 버튼 */}
        <button className="mylib" onClick={() => navigate("/mylib")}>
          내 서재 📖
        </button>

        {/* 이 달의 독서량 표시 */}
        <div className="monthly_reading">
          <div>{`${nickname} 님의 ${monthlyReading.month}월의 독서량`}</div>
          <div className="reading_count">{`${monthlyReading.readingCount}권`}</div>
        </div>

        {/* 도서 카테고리 */}
        <div className="category_title">도서 카테고리</div>
        <div className="category_buttons">
          {categoryOptions.map((categoryData) => (
            <button
              className={`category_button ${
                selectedCategory === categoryData.category ? "selected" : ""
              }`}
              key={categoryData.category_id}
              onClick={() => handleCategoryButtonClick(categoryData.category)}
            >
              {categoryData.category}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MainNav;
