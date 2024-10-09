import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header2 from "components/Header/Header2";
import boogi2 from "assets/img/boogi2.jpg";
import api from "../../api"; // Axios 인스턴스 import
import { useAuth } from "AuthContext";
import CustomModal from "../../components/CustomModal";

const MyLib = () => {
  const [activeTab, setActiveTab] = useState("책장");
  const [subTab, setSubTab] = useState("독서 중");
  const [readingBooks, setReadingBooks] = useState([]);
  const [completedBooks, setCompletedBooks] = useState([]);
  const [nickname, setNickname] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // 편집 모드 상태
  const [selectedBooks, setSelectedBooks] = useState([]); // 선택된 책 목록
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 모달의 타입 (다시 읽으시겠습니까? / 추가 옵션)
  const [selectedCompletedBook, setSelectedCompletedBook] = useState(null);

  const { isAuthenticated } = useAuth(); // 로그인 상태 가져오기
  const navigate = useNavigate();

  useEffect(() => {
    // 사용자 데이터 가져오기
    const fetchUserData = async () => {
      try {
        // 닉네임 및 사용자 ID 가져오기
        const userDataResponse = await api.get(`/user-data`);
        const { userId, nickname } = userDataResponse.data;
        setNickname(nickname);
        setUserId(userId);
      } catch (error) {
        alert("사용자 데이터를 가져오는 중 오류가 발생했습니다.");
      }

      if (!userId) {
        navigate("/login"); // 로그인 페이지로 리다이렉트
        return;
      }
    };
    fetchUserData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!userId) return; // userId가 로드되지 않았으면 아무 작업도 하지 않음

    const fetchBooks = async () => {
      try {
        if (activeTab === "책장") {
          if (subTab === "독서 중") {
            // 독서 중인 책 가져오기
            const readingResponse = await api.get(`/bookshelf/reading`, {
              params: { userId },
            });
            const readingBooksWithDetails = await Promise.all(
              readingResponse.data.map(async (userBook) => {
                const bookDetailsResponse = await api.get(
                  `/books/${userBook.bookId}`
                );
                const bookDetails = bookDetailsResponse.data;

                const progressRate =
                  Math.round(userBook.lastReadPage * 10) / 10;

                return {
                  ...userBook,
                  ...bookDetails,
                  startDate: userBook.startDate,
                  progressRate,
                };
              })
            );

            // 독서 완료 책 중 lastReadPage가 100이 아닌 책 가져오기
            const completedResponse = await api.get(`/bookshelf/completed`, {
              params: { userId },
            });
            const incompleteCompletedBooks = await Promise.all(
              completedResponse.data
                .filter((userBook) => userBook.lastReadPage < 100)
                .map(async (userBook) => {
                  const bookDetailsResponse = await api.get(
                    `/books/${userBook.bookId}`
                  );
                  const bookDetails = bookDetailsResponse.data;

                  return {
                    ...userBook,
                    ...bookDetails,
                    startDate: userBook.startDate, // 독서 중 시작 날짜
                    progressRate: Math.round(userBook.lastReadPage * 10) / 10, // 소수점 첫째 자리에서 반올림된 백분율
                  };
                })
            );

            // 독서 중인 책 + lastReadPage가 100이 아닌 독서 완료 책 결합 후 정렬
            const combinedBooks = [
              ...readingBooksWithDetails,
              ...incompleteCompletedBooks,
            ];
            combinedBooks.sort(
              (a, b) => new Date(b.startDate) - new Date(a.startDate)
            );

            setReadingBooks(combinedBooks);
          } else if (subTab === "독서 완료") {
            // 독서 완료 탭일 경우 독서 완료 책 목록 가져오기
            const completedResponse = await api.get(`/bookshelf/completed`, {
              params: { userId },
            });
            const completedBooksWithDetails = await Promise.all(
              completedResponse.data.map(async (userBook) => {
                const bookDetailsResponse = await api.get(
                  `/books/${userBook.bookId}`
                );
                const bookDetails = bookDetailsResponse.data;

                return {
                  ...userBook,
                  ...bookDetails,
                  endDate: userBook.endDate, // 독서 완료 날짜
                };
              })
            );
            // 정렬: 최신 완료 책 먼저
            completedBooksWithDetails.sort(
              (a, b) => new Date(b.endDate) - new Date(a.endDate)
            );
            setCompletedBooks(completedBooksWithDetails);
          }
        } else if (activeTab === "My Favorite") {
          const favoritesResponse = await api.get(
            `/bookmarks/list?userId=${userId}`
          );
          const favoriteBookIds = favoritesResponse.data.map(
            (favorite) => favorite.bookId
          );

          const booksResponse = await api.get(`/books`);
          const allBooks = booksResponse.data;

          const favoriteBooks = allBooks.filter((book) =>
            favoriteBookIds.includes(book.bookId)
          );

          setFavorites(favoriteBooks);
        }
      } catch (error) {
        alert("책 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    };

    fetchBooks();
  }, [activeTab, subTab, userId]);

  useEffect(() => {
    // 탭이 변경될 때 편집 모드를 해제
    setIsEditing(false);
    setSelectedBooks([]);
  }, [activeTab]);

  const handleBookClick = (bookId, tab) => {
    if (tab === "독서 중") {
      // 독서 중인 책은 바로 리더기로 이동
      navigate(`/books/${bookId}/content`);
    } else if (tab === "My Favorite") {
      // 즐겨찾기 책은 책 상세 페이지로 이동
      navigate(`/books/details/${bookId}`);
    } else if (tab === "독서 완료") {
      // 독서 완료된 책은 커스텀 모달을 띄움
      setSelectedCompletedBook(bookId); // 클릭한 책 ID 저장
      setModalType("confirm"); // 모달 타입 설정
      setIsModalOpen(true); // 모달 열기
    }
  };

  const handleModalConfirmYes = () => {
    if (selectedCompletedBook) {
      navigate(`/books/${selectedCompletedBook}/content`);
    }
    setIsModalOpen(false); // 모달 닫기
  };

  const handleModalConfirmNo = () => {
    setModalType("options"); // 모달 타입을 옵션으로 설정
    setIsModalOpen(true); // 모달 열기
  };

  const handleModalOptionNavigate = (path) => {
    navigate(path);
    setIsModalOpen(false); // 모달 닫기
  };

  // 편집 모드일 때 책 선택
  const handleSelectBook = (bookId) => {
    setSelectedBooks((prevSelected) =>
      prevSelected.includes(bookId)
        ? prevSelected.filter((id) => id !== bookId)
        : [...prevSelected, bookId]
    );
  };

  // 선택된 책 삭제 기능
  const handleDeleteBooks = async () => {
    if (selectedBooks.length === 0) {
      alert("선택한 책이 없습니다.");
      setIsEditing(false);
      return;
    }
    try {
      await Promise.all(
        selectedBooks.map(async (bookId) => {
          // 즐겨찾기에서 삭제
          await api.delete(
            `/bookmarks/remove?userId=${userId}&bookId=${bookId}`
          );
        })
      );
      setFavorites((prevFavorites) =>
        prevFavorites.filter((book) => !selectedBooks.includes(book.bookId))
      );
      setSelectedBooks([]);
      setIsEditing(false);
      alert("My Favorite 목록에서 삭제되었습니다.");
    } catch (error) {
      alert("책 삭제 중 오류가 발생했습니다.");
    }
  };

  const renderBookList = (books, tab) => {
    return books.length > 0 ? (
      books.map((book) => (
        <span key={book.bookId} className="mylib-book-item">
          <div className="mylib-book-cover-wrapper">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className={`book-cover ${
                isEditing && selectedBooks.includes(book.bookId)
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                isEditing
                  ? handleSelectBook(book.bookId)
                  : handleBookClick(book.bookId, tab)
              }
            />
          </div>
          <span className="book-details">
            <span className="book-title">{book.title}</span>
            <span className="book-author">{book.author}</span>
            {tab === "독서 중" && (
              <>
                <span className="start_on">Started on: {book.startDate}</span>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${book.progressRate}%` }}
                  />
                </div>
                <span className="progress-rate">
                  {book.progressRate}%{" "}
                  {/* 소수점 첫째 자리까지 반올림된 백분율 */}
                </span>
              </>
            )}
            {tab === "독서 완료" && (
              <>
                <span className="completed_on">완독일: {book.endDate}</span>
              </>
            )}
          </span>
        </span>
      ))
    ) : (
      <p>목록이 비어 있습니다.</p>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "책장":
        return (
          <div>
            <div>
              <ul className="subtab_menu">
                {["독서 중", "독서 완료"].map((tab) => (
                  <li
                    key={tab}
                    className={tab === subTab ? "active" : ""}
                    onClick={() => setSubTab(tab)}
                  >
                    {tab}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ul className="mybook-list">
                {renderBookList(
                  subTab === "독서 중" ? readingBooks : completedBooks,
                  subTab
                )}
              </ul>
            </div>
          </div>
        );
      case "My Favorite":
        return (
          <div>
            <h2>My Favorite</h2>
            <div className="favorite-header">
              <div className="favorite-actions">
                {isEditing ? (
                  <>
                    <button
                      className="favorite-delete-button"
                      onClick={handleDeleteBooks}
                    >
                      삭제
                    </button>
                  </>
                ) : (
                  <button
                    className="favorite-edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    편집
                  </button>
                )}
              </div>
            </div>
            <ul className="mybook-list">
              {renderBookList(favorites, "My Favorite")}
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header2 />
      <div id="mylib">
        <div className="profile_container">
          <span>
            <img src={boogi2} alt="프로필" className="profile_img"></img>
          </span>
          <span className="profile_title">
            {nickname}
            <span>님의 서재</span>
          </span>
        </div>
        <div>
          <ul className="mylib_menu">
            {["책장", "My Favorite"].map((tab) => (
              <li
                key={tab}
                className={tab === activeTab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </li>
            ))}
          </ul>
        </div>
        <div className="tab_content">{renderContent()}</div>
        {isModalOpen && (
          <CustomModal
            type={modalType}
            onConfirm={handleModalConfirmYes}
            onCancel={handleModalConfirmNo}
            onOptionNavigate={handleModalOptionNavigate}
            userId={userId}
            bookId={selectedCompletedBook}
          />
        )}
      </div>
    </>
  );
};

export default MyLib;
