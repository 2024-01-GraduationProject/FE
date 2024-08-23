import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { useAuth } from "AuthContext";
const FamousBook = () => {
  const [books, setBooks] = useState([]); // 추천 책 목록 상태
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login"); // 로그인 페이지로 리다이렉트
      return;
    }

    const fetchUserData = async () => {
      try {
        // API 호출
        const response = await api.get("/user-data", {});

        // 사용자 데이터 설정
        setUserData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendedBooks = async () => {
      try {
        // 연령대 및 성별 정보 없이 추천 도서 가져오기
        const booksResponse = await api.get("/recommend/ageAndGender");
        const shuffledBooks = shuffleArray(booksResponse.data);
        const selectedBooks = shuffledBooks.slice(0, 4); // 랜덤으로 4개의 책 선택
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

  // 배열을 무작위로 섞는 함수
  const shuffleArray = (array) => {
    return array.sort(() => Math.random() - 0.5);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const { age, gender } = userData;

  const goToBookDetail = (id) => {
    navigate(`/books/details/${id}`);
  };

  return (
    <>
      <div className="main-booklist-component">
        요즘 <strong>{age}</strong> <strong>{gender}</strong>이(가) 많이 보는 책{" "}
      </div>
      <div className="famousBook-list-wrapper">
        <div className="famousBook-list">
          {books.length > 0 ? (
            books.map((book) => (
              <div
                key={book.bookId}
                className="book-item"
                onClick={() => goToBookDetail(book.bookId)}
              >
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="book-cover"
                />
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
    </>
  );
};

export default FamousBook;
