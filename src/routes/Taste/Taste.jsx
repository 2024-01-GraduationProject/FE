import React, { useState } from "react";
import { Link } from "react-router-dom";
import { tasteAge, tasteGender, tasteText } from "constants";
import Header2 from "components/Header/Header2";

const Taste = () => {
  const [selectedMoods, setSelectedMoods] = useState(""); // 선택된 분위기 저장
  const [selectedAge, setSelectedAge] = useState(""); // 선택된 연령 저장
  const [selectedGender, setSelectedGender] = useState(""); // 선택된 성별 저장

  // 분위기 버튼 클릭 핸들러
  const handleMoodClick = (title) => {
    if (selectedMoods.includes(title)) {
      setSelectedMoods(selectedMoods.filter((mood) => mood !== title));
    } else {
      setSelectedMoods([...selectedMoods, title]);
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

  // 다음으로 버튼 클릭 시 서버로 데이터 전송
  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/save-taste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mood: selectedMoods,
          age: selectedAge,
          gender: selectedGender,
        }),
      });
      if (response.ok) {
        alert("선택된 정보가 서버에 전송되었습니다.");
        // 서버로 전송 성공 후 처리할 로직 추가
      } else {
        const errorData = await response.json();
        alert(`서버로 데이터 전송 실패: ${errorData.message}`);
      }
    } catch (error) {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <Header2 />
      <div id="taste">
        <div className="taste_text">여러분의 독서 취향을 알려주세요!</div>
        <div className="select_taste">
          <div>연령/성별</div>
          <select
            className="selectAge"
            onChange={handleAgeChange}
            value={selectedAge}
          >
            <option value="">연령 선택</option>
            {tasteAge.map((taste) => (
              <option key={taste.age} value={taste.age}>
                {taste.age}
              </option>
            ))}
          </select>

          <select
            className="selectGender"
            onChange={handleGenderChange}
            value={selectedGender}
          >
            <option value="">성별 선택</option>
            {tasteGender.map((taste) => (
              <option key={taste.gender} value={taste.gender}>
                {taste.gender}
              </option>
            ))}
          </select>
        </div>

        <div className="mood">
          <div>유형(분위기)</div>
          {tasteText.map((taste, key) => (
            <button
              key={key}
              className={selectedMoods.includes(taste.title) ? "selected" : ""}
              onClick={() => handleMoodClick(taste.title)}
            >
              #{taste.title}
            </button>
          ))}
        </div>

        <div>
          <Link to="/tastenext">
            <button className="nextbtn">{">"} 다음으로</button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Taste;
