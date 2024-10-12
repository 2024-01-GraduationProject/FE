import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FamousBook, Header2 } from "components";
import api from "../../api";
import { useAuth } from "AuthContext";

const BookDetail = () => {
  const { bookId } = useParams(); // URL 파라미터로부터 book_id를 가져옴.
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // 로그인 상태 가져오기

  const [book, setBook] = useState(null);
  const [bookCategories, setBookCategories] = useState([]); // 카테고리 배열 추가
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null); // 에러 상태 추가
  const [userId, setUserId] = useState(null); // 사용자 ID 상태 추가
  const [isLoading, setIsLoading] = useState(true); // 로드 상태 추가

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await api.get(`/user-data`);
        setUserId(userResponse.data.userId); // 사용자 ID 저장
      } catch (err) {
        setError("사용자 데이터를 가져오는 데 실패했습니다.");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId === null) return; // 사용자 ID가 로드되지 않았으면 아무 작업도 하지 않음
    if (!isAuthenticated) {
      navigate("/login"); // 로그인 페이지로 리다이렉트
      return;
    }
    const fetchBookAndUserbookId = async () => {
      try {
        // 책 정보를 가져오기
        const bookResponse = await api.get(`/books/${bookId}`);
        setBook(bookResponse.data.book);
        setBookCategories(bookResponse.data.bookCategory);

        // 즐겨찾기 상태 확인
        const isFav = await checkFavoriteStatus(`${userId}-${bookId}`);
        setIsFavorite(isFav);

        // 다운로드 상태 확인
        const downloadStatus = await checkDownloadStatus();
        setIsDownloaded(downloadStatus);
      } catch (err) {
        setError("데이터를 가져오는 데 실패했습니다.");
      } finally {
        setIsLoading(false); // 데이터 로드 완료 후 로딩 상태 false로 설정
      }
    };

    fetchBookAndUserbookId();
  }, [userId, bookId]);

  const checkFavoriteStatus = async () => {
    try {
      // 새로운 북마크 목록 조회 엔드포인트
      const bookmarkResponse = await api.get(`/bookmarks/list`, {
        params: { userId },
      });
      const bookmarks = bookmarkResponse.data;

      // 현재 book_id와 일치하는 책을 찾고, favorite 상태 확인
      const currentBook = bookmarks.find((b) => b.bookId === parseInt(bookId));

      return currentBook ? currentBook.favorite : false; // 북마크 목록에 해당 책이 없으면 false 반환
    } catch (error) {
      setError("즐겨찾기 상태를 확인하는 데 실패했습니다.");
      return false; // 에러 발생 시 기본값 반환
    }
  };

  // 다운로드 상태 확인 함수 추가
  const checkDownloadStatus = async () => {
    try {
      const readingResponse = await api.get(`/bookshelf/reading`, {
        params: { userId },
      });
      const readingBooks = readingResponse.data;

      // 현재 책이 "READING" 상태인지 확인
      const isReading = readingBooks.some(
        (book) => book.bookId === parseInt(bookId) && book.status === "READING"
      );

      return isReading;
    } catch (error) {
      console.error("다운로드 상태 확인 실패: ", error);
      return false; // 에러 발생 시 기본값 반환
    }
  };

  const handleDownload = async () => {
    try {
      const currentDate = new Date().toISOString().split("T")[0]; // 현재 날짜를 가져옴 (yyyy-mm-dd)
      const requestData = {
        userId: parseInt(userId),
        bookId: parseInt(bookId),
        startDate: currentDate,
      };

      // 다운로드 누르면 '독서 중'에 저장
      // URL에 쿼리 파라미터로 userId, bookId, startDate를 포함
      const url = `/bookshelf/add-to-reading?userId=${encodeURIComponent(
        userId
      )}&bookId=${encodeURIComponent(bookId)}&startDate=${encodeURIComponent(
        currentDate
      )}`;

      // requestData 대신 URL에 쿼리 파라미터로 데이터를 전송
      const response = await api.post(url);

      setIsDownloaded(true);
    } catch (error) {
      if (error.response) {
        console.error(
          `책 다운로드 실패 (상태 코드: ${error.response.status}): `,
          error.response.data
        );
      } else {
        console.error("책 다운로드 실패: ", error.message);
      }
      setError("책 다운로드에 실패했습니다.");
    }
  };

  const handleAddBookmark = async () => {
    if (!isAuthenticated) {
      navigate("/login"); // 로그인 페이지로 리다이렉트
      return;
    }

    try {
      await api.post(`/bookmarks/addBook`, null, {
        params: { userId, bookId: bookId },
      });
      setIsFavorite(true);
    } catch (error) {
      setError("즐겨찾기 추가에 실패했습니다.");
    }
  };

  const handleRemoveBookmark = async () => {
    if (!isAuthenticated) {
      navigate("/login"); // 로그인 페이지로 리다이렉트
      return;
    }

    try {
      await api.delete(`/bookmarks/remove`, {
        params: { userId, bookId: bookId },
      });
      setIsFavorite(false);
    } catch (error) {
      setError("즐겨찾기 제거에 실패했습니다.");
    }
  };

  const handleRead = () => {
    if (book && book.content) {
      navigate(`/books/${bookId}/content`);
    } else {
      setError("책의 내용을 로드하는 데 실패했습니다.");
    }
  };

  if (!book) return <p>책 정보를 불러오지 못했습니다.</p>;

  return (
    <>
      <Header2 />

      <div id="book-detail">
        <div className="book-cover-wrapper">
          <div className="bookDetail-cover">
            <img src={book.coverImageUrl} alt={`${book.title} cover`} />
          </div>
        </div>

        <div className="book-info">
          <div className="info-header">
            <h1>{book.title}</h1>
            <div className="book-actions">
              {!isDownloaded ? (
                <button className="download-button" onClick={handleDownload}>
                  다운로드
                </button>
              ) : (
                <button className="read-button" onClick={handleRead}>
                  바로 읽기
                </button>
              )}
              <button
                className={`favorite-button ${isFavorite ? "active" : ""}`}
                onClick={isFavorite ? handleRemoveBookmark : handleAddBookmark}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>
            </div>
          </div>

          <div className="info-item summary">
            <p>{book.summary}</p>
          </div>
          <div className="info-item author">
            <p>{book.author} 지음</p>
          </div>
          <div className="info-item publisher">
            <p>
              {book.publisher} | {book.publicationDate}
            </p>
            <p>
              {bookCategories
                .map((category, index) => (
                  <span
                    key={index}
                    className="category-link"
                    onClick={() => navigate(`/books/category/${category}`)}
                  >
                    {category}
                  </span>
                ))
                .reduce((prev, curr) => [prev, " , ", curr])}{" "}
            </p>
          </div>
        </div>
      </div>

      <div className="bookDetail_wrapper">
        <FamousBook />
      </div>
    </>
  );
};

export default BookDetail;
