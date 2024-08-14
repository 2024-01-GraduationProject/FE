import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header2 } from "components";
import { BestNew } from "components";
import api from "../../api";
import { useAuth } from "AuthContext";

const BookDetail = () => {
  const { book_id } = useParams(); // URL 파라미터로부터 book_id를 가져옴.
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // 로그인 상태 가져오기

  const [book, setBook] = useState(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null); // 에러 상태 추가
  const [userbookId, setUserbookId] = useState(null);
  const [userId, setUserId] = useState(null); // 사용자 ID 상태 추가

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await api.get("/user-data");
        setUserId(userResponse.data.userId); // 사용자 ID 저장
      } catch (err) {
        console.error("사용자 데이터 가져오기 실패: ", err);
        setError("사용자 데이터를 가져오는 데 실패했습니다.");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId === null) return; // 사용자 ID가 로드되지 않았으면 아무 작업도 하지 않음

    const fetchBookAndUserbookId = async () => {
      try {
        // 책 정보를 가져오기
        const bookResponse = await api.get(`/books/${book_id}`);
        setBook(bookResponse.data);

        // 사용자와 책 ID로 userbookId 가져오기
        const userbookResponse = await api.get(`/bookmarks/userbook`, {
          params: { userId, bookId: book_id },
        });
        setUserbookId(userbookResponse.data.userbookId);

        // 즐겨찾기 상태 확인
        if (isAuthenticated && userbookId) {
          const bookmarkResponse = await api.get(
            `/bookmarks/user/${userbookId}`
          );
          const bookmarks = bookmarkResponse.data;
          setIsFavorite(bookmarks.some((b) => b.bookId === book_id));
        }
      } catch (err) {
        console.error(`데이터 가져오기 실패: `, err);
        setError("데이터를 가져오는 데 실패했습니다.");
      }
    };

    fetchBookAndUserbookId();
  }, [userId, book_id, isAuthenticated, userbookId]);

  const handleDownload = async () => {
    try {
      // 책 다운로드 API 호출
      await api.post(`/books/${book_id}/download`);
      setIsDownloaded(true);
    } catch (error) {
      console.error(`${book_id} 책 다운로드 실패: `, error);
    }
  };

  const handleAddBookmark = async () => {
    if (!isAuthenticated) {
      navigate("/login"); // 로그인 페이지로 리다이렉트
      return;
    }

    try {
      await api.post(`/bookmarks/addBook`, null, {
        params: { userbookId },
      });
      setIsFavorite(true);
    } catch (error) {
      console.error("즐겨찾기 추가 실패: ", error);
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
        params: { userbookId },
      });
      setIsFavorite(false);
    } catch (error) {
      console.error("즐겨찾기 제거 실패: ", error);
      setError("즐겨찾기 제거에 실패했습니다.");
    }
  };

  const handleRead = () => {
    navigate(`/books/${book_id}/content`);
  };

  if (!book) return <p>Loading...</p>;

  return (
    <>
      <Header2 />

      <div id="book-detail">
        <div className="bookDetail-cover">
          <img src={book.coverImageUrl} alt={`${book.title} cover`} />
        </div>

        <div className="book-info">
          <div className="info-header">
            <h1>{book.title}</h1>
            <div className="book-actions">
              <button className="download-button" onClick={handleDownload}>
                다운로드
              </button>
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
              {book.category} | {book.publisher} | {book.publicationDate}
            </p>
          </div>
        </div>

        {isDownloaded && (
          <div className="read-button-container">
            <button className="read-button" onClick={handleRead}>
              바로 읽기
            </button>
          </div>
        )}
      </div>

      <BestNew />
    </>
  );
};

export default BookDetail;
