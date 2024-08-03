import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header2 } from "components";
import { FaCamera } from "react-icons/fa";
import boogi3 from "../../assets/img/boogi3.jpg";
import api from "../../api";
import { useAuth } from "AuthContext";

const EditMyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ageOptions, setAgeOptions] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [bookCategories, setBookCategories] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  const [initialData, setInitialData] = useState({});
  const { isAuthenticated } = useAuth(); // 로그인 여부와 토큰 가져오기

  useEffect(() => {
    if (!isAuthenticated) {
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [userData, agesData, gendersData, categoriesData] =
          await Promise.all([
            api.get("/user-data"),
            api.get("/ages"),
            api.get("/genders"),
            api.get("/categories"),
          ]);

        setUser({
          newNickname: userData.data.nickname,
          newEmail: userData.data.email,
          newAge: userData.data.age,
          newGender: userData.data.gender,
          newBookTaste: userData.data.bookTaste,
          //newProfilePic: userData.data.profilePic,
          agreements: userData.data.agreements,
        });

        setInitialData({
          newNickname: userData.data.nickname,
          newEmail: userData.data.email,
          newAge: userData.data.age,
          newGender: userData.data.gender,
          newBookTaste: userData.data.bookTaste,
          //newProfilePic: userData.data.profilePic,
          newPassword: "", // 초기에는 비밀번호를 변경하지 않음
          agreements: userData.data.agreements,
        });

        setAgeOptions(agesData.data);
        setGenderOptions(gendersData.data);
        setBookCategories(categoriesData.data);
        console.log(userData);
      } catch (error) {
        console.error("데이터 불러오기 실패: ", error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    console.log("currentPassword has changed:", currentPassword);
  }, [currentPassword]);

  const hasChanges = () => {
    return (
      user.newNickname !== initialData.newNickname ||
      user.newAge !== initialData.newAge ||
      user.newGender !== initialData.newGender ||
      JSON.stringify(user.newBookTaste) !==
        JSON.stringify(initialData.newBookTaste) ||
      //user.newProfilePic !== initialData.newProfilePic ||
      newPassword !== "" ||
      user.agreements !== initialData.agreements
    );
  };

  const handleSave = async () => {
    console.log("isAuthenticated:", isAuthenticated);
    console.log("currentPassword:", currentPassword);
    console.log("isPasswordVerified:", isPasswordVerified);
    console.log("hasChanges:", hasChanges());

    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!currentPassword) {
      alert("현재 비밀번호를 입력해주세요.");
      return;
    }

    if (!isPasswordVerified) {
      alert("현재 비밀번호 확인을 진행해주세요.");
      return;
    }

    if (!hasChanges()) {
      alert("수정된 항목이 없습니다.");
      return;
    }

    try {
      // 사용자 데이터 업데이트 요청
      const response = await api.post("/update-userData", {
        newNickname: user.newNickname,
        newEmail: user.newEmail,
        newAge: user.newAge,
        newGender: user.newGender,
        newBookTaste: user.newBookTaste,
        //newProfilePic: user.newProfilePic,
        newPassword,
        agreements: user.agreements,
      });
      console.log("Response:", response);
      alert("저장이 완료되었습니다.");
      navigate("/mypage");
    } catch (error) {
      if (error.response) {
        // 서버가 상태 코드를 반환한 경우 (응답 수신)
        console.error(
          "서버 응답 오류: ",
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        // 요청이 전송되었으나 응답을 수신하지 못한 경우
        console.error("요청 오류: 응답 없음", error.request);
      } else {
        // 요청 설정 중 문제가 발생한 경우
        console.error("요청 설정 오류: ", error.message);
      }
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const checkCurrentPassword = async () => {
    if (!currentPassword) {
      alert("현재 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const checkPasswordResponse = await api.post("/check-password", {
        currentPassword,
      });
      console.log(checkPasswordResponse.data);
      if (checkPasswordResponse.data) {
        setPasswordError("");
        setIsPasswordVerified(true);
        alert("현재 비밀번호가 확인되었습니다.");
      } else {
        setPasswordError("현재 비밀번호가 올바르지 않습니다.");
        setIsPasswordVerified(false);
      }
    } catch (error) {
      console.error("비밀번호 확인 실패: ", error);
      setPasswordError("비밀번호 확인에 실패했습니다. 다시 시도해주세요.");
      setIsPasswordVerified(false);
    }
  };

  const onChangeNicknameHandler = async (e) => {
    const nicknameValue = e.target.value.replace(/\s/g, ""); // 공백 제거
    setUser({ ...user, newNickname: nicknameValue });
    setIsNicknameAvailable(false); // 닉네임이 변경되면 중복 확인 상태 초기화
  };

  const checkNicknameAvailability = async () => {
    if (user.newNickname === "") {
      setNicknameError("닉네임을 입력해주세요.");
      setIsNicknameAvailable(false);
      return;
    }

    try {
      const response = await api.post("/validate-nickname", {
        nickname: user.newNickname,
      });

      if (response.data.isDuplicate) {
        setNicknameError("이미 사용 중인 닉네임입니다.");
        setIsNicknameAvailable(false);
      } else {
        setNicknameError("사용 가능한 닉네임입니다.");
        setIsNicknameAvailable(true);
      }
    } catch (error) {
      console.error("닉네임 중복 확인 오류: ", error);
      setNicknameError(
        "닉네임 중복 확인 중 오류가 발생했습니다. 관리자에게 문의해주세요."
      );
      setIsNicknameAvailable(false);
    }
  };

  const onChangeNewPasswordHandler = (e) => {
    const value = e.target.value.replace(/\s/g, ""); // 공백 제거
    setNewPassword(value);
    passwordCheckHandler(value);
  };

  const passwordCheckHandler = (password) => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[!@$&-_])(?=.*[0-9]).{8,16}$/;
    if (!passwordRegex.test(password)) {
      setNewPasswordError(
        "비밀번호는 8~16자리 영문 대소문자 + 숫자 + ! @ $ & - _ 조합으로 입력해주세요."
      );
    } else {
      setNewPasswordError("");
    }
  };

  const onChangeCurrentPasswordHandler = (e) => {
    const value = e.target.value.replace(/\s/g, ""); // 공백 제거
    setCurrentPassword(value);
    setPasswordError(""); // 현재 비밀번호 변경 시 이전 에러 메시지 제거
    setIsPasswordVerified(false); // 비밀번호가 변경되면 확인 상태 초기화
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <Header2 />
      <div className="edit-profile">
        <div className="profile-pic-section">
          <img
            src={user.newProfilePic || boogi3}
            alt="프로필"
            className="profile-pic"
          />
          <div className="camera-icon-wrapper">
            <label htmlFor="profilePicInput">
              <FaCamera className="camera-icon" />
            </label>
            {/*
            <input
              id="profilePicInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) =>
                setUser({ ...user, newProfilePic: e.target.files[0] })
              }
            /> */}
          </div>
        </div>
        <div className="form-section">
          <label>
            닉 네 임 :
            <input
              type="text"
              value={user.newNickname}
              onChange={onChangeNicknameHandler}
            />
            <button
              className="confirmBtn"
              type="button"
              onClick={checkNicknameAvailability}
            >
              중복 확인
            </button>
          </label>
          {nicknameError && (
            <small className={isNicknameAvailable ? "NicknameAvailable" : ""}>
              * {nicknameError}
            </small>
          )}
          <label>
            이 메 일 : <span className="user-email">{user.newEmail}</span>
          </label>
          <label>
            현재 비밀번호 :
            <input
              type="password"
              value={currentPassword}
              onChange={onChangeCurrentPasswordHandler}
            />
            <button
              type="button"
              className="confirmBtn"
              onClick={checkCurrentPassword}
            >
              확인
            </button>
          </label>
          {passwordError && (
            <small className="PasswordError">* {passwordError}</small>
          )}
          <label>
            새 비밀번호 :
            <input
              type="password"
              value={newPassword}
              onChange={onChangeNewPasswordHandler}
            />
          </label>
          {newPasswordError && (
            <small className="PasswordError">* {newPasswordError}</small>
          )}
          <label>
            연 령 대 :
            <select
              value={user.newAge}
              onChange={(e) => setUser({ ...user, newAge: e.target.value })}
            >
              {ageOptions.map((age) => (
                <option key={age.age_id} value={age.age}>
                  {age.age}
                </option>
              ))}
            </select>
          </label>
          <label>
            성 별 :
            <select
              value={user.newGender}
              onChange={(e) => setUser({ ...user, newGender: e.target.value })}
            >
              {genderOptions.map((gender) => (
                <option key={gender.gender_id} value={gender.gender}>
                  {gender.gender}
                </option>
              ))}
            </select>
          </label>
          <div>
            <label>관심 분야 : </label>
            <div className="preferences">
              {bookCategories.map((category) => (
                <button
                  key={category.category}
                  className={
                    user.newBookTaste.includes(category.category)
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setUser((prevState) => {
                      const newBookTaste = prevState.newBookTaste.includes(
                        category.category
                      )
                        ? prevState.newBookTaste.filter(
                            (id) => id !== category.category
                          )
                        : [...prevState.newBookTaste, category.category];
                      return { ...prevState, newBookTaste };
                    })
                  }
                >
                  # {category.category}
                </button>
              ))}
            </div>
          </div>
          <div className="eventAlarm-group">
            <label>이벤트 알림 수신 :</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={user.agreements.eventAlarm === true}
                  onChange={() =>
                    setUser({
                      ...user,
                      agreements: { ...user.agreements, eventAlarm: true },
                    })
                  }
                />
                동의
              </label>
              <label>
                <input
                  type="radio"
                  checked={user.agreements.eventAlarm === false}
                  onChange={() =>
                    setUser({
                      ...user,
                      agreements: { ...user.agreements, eventAlarm: false },
                    })
                  }
                />
                비동의
              </label>
            </div>
          </div>
          <button className="saveBtn" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMyPage;
