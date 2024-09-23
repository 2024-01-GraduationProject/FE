import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "AuthContext";
import api from "../../api";

const RecommendBook = () => {
  const [books, setBooks] = useState([]); // 추천 책 목록 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nickname, setNickname] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 인증 상태가 false이면 로그인 페이지로 리디렉션
    if (!isAuthenticated) {
      navigate("/login");
    }

    // 사용자 데이터 가져오기
    const fetchUserData = async () => {
      try {
        // 닉네임 가져오기
        const nicknameResponse = await api.get(`/user-nickname`);
        setNickname(nicknameResponse.data);
      } catch (error) {
        alert("사용자 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    };

    const fetchRecommendedBooks = async () => {
      try {
        // 추천 도서 가져오기
        const booksResponse = await api.get(`/recommend/userTaste`);
        const selectedBooks = booksResponse.data;
        setBooks(selectedBooks);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchRecommendedBooks();
  }, [isAuthenticated, navigate]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const goToBookDetail = (id) => {
    navigate(`/books/details/${id}`);
  };

  return (
    <>
      <div className="booklist-wrapper">
        <div className="main-booklist-component">
          <strong className="userNickname">{nickname}</strong>
          <span className="groupingText">님, 이런 책 어떠세요?</span>
        </div>
        <div className="famousBook-list-wrapper">
          <div className="book-list">
            {books.length > 0 ? (
              books.map((book) => (
                <div
                  key={book.bookId}
                  className="recommend-book-item"
                  onClick={() => goToBookDetail(book.bookId)}
                >
                  <div className="book-cover-wrapper">
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="book-cover"
                    />
                  </div>
                  <div className="book-details">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">
                      {book.author} | {book.publisher}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p>추천 책이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RecommendBook;
