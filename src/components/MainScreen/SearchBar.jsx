import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import searchIcon from "assets/img/ico/search.ico";
import api from "../../api";

const SearchBar = ({ onSearch }) => {
  const [searchWord, setSearchWord] = useState(""); // 검색어 상태
  const navigate = useNavigate();

  // 검색어 입력 핸들러
  const onSearchChange = (e) => {
    setSearchWord(e.target.value);
  };

  // 검색 버튼 클릭 핸들러
  const handleSearch = async (e) => {
    e.preventDefault();

    // 검색어가 비어있는 경우 검색하지 않도록 처리
    if (!searchWord.trim()) {
      alert("검색어를 입력해주세요.");
      return;
    }

    try {
      const response = await api.get(`/books/search`, {
        params: { searchWord },
      });

      if (response.status === 200) {
        onSearch(response.data, searchWord); // 검색 결과를 상위 컴포넌트에 전달
        navigate("/searchlist", {
          state: { searchResults: response.data, searchWord },
        }); // 검색 결과 페이지로 이동
      }
    } catch (error) {
      console.error("도서 검색 중 오류가 발생했습니다: ", error);
      onSearch([], searchWord); // 오류 발생 시 빈 결과 전달
    }
  };

  // Enter 키 감지 핸들러
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(e); // Enter 키가 눌리면 검색 실행
    }
  };

  return (
    <div id="searchbar">
      <div className="search">
        <input
          className="searchInput"
          type="text"
          value={searchWord}
          onChange={onSearchChange}
          onKeyDown={handleKeyDown}
          placeholder=" 검색어를 입력해주세요."
        />
        <button className="searchbtn" onClick={handleSearch}>
          <img className="searchIcon" src={searchIcon} alt="돋보기" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
