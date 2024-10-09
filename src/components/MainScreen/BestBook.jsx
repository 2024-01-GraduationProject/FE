import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "AuthContext";
import api from "../../api";
import { FaRegThumbsUp } from "react-icons/fa";

const BestBook = () => {
  const [bestBooks, setBestBooks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchBestBooks = async () => {
      try {
        // 추천 도서 가져오기
        const booksResponse = await api.get(`/books/best`);
        const bestBooks = booksResponse.data;
        setBestBooks(bestBooks);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBestBooks();

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === bestBooks.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000); // 5초마다 슬라이드

    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, bestBooks.length]);

  const goToBookDetail = (id) => {
    navigate(`/books/details/${id}`);
  };

  // indicator 클릭 시 해당 인덱스로 이동하는 함수
  const handleIndicatorClick = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="best-book-container">
      {bestBooks.length > 0 ? (
        <>
          <div className="best-book-wrapper">
            <h2 className="best-book-title">
              이 달의 <span>BEST </span> <FaRegThumbsUp size="1.3em" />
            </h2>
            <div className="bestbook-info">
              <div className="book-cover-wrapper">
                <img
                  src={bestBooks[currentIndex].coverImageUrl}
                  alt={bestBooks[currentIndex].title}
                  className="bestbook-cover"
                  onClick={() => goToBookDetail(bestBooks[currentIndex].id)}
                />
              </div>
              <div className="bestbook-details">
                <h3
                  className="bestbook-title"
                  onClick={() => goToBookDetail(bestBooks[currentIndex].id)}
                >
                  {bestBooks[currentIndex].title}
                </h3>
                <p className="bestbook-author">
                  {bestBooks[currentIndex].author}
                </p>
                <p className="bestbook-publisher">
                  {bestBooks[currentIndex].publisher}
                  {"   "}|{"   "}
                  {bestBooks[currentIndex].category}
                  {"   "}|{"   "}
                  {bestBooks[currentIndex].publicationDate}
                </p>
              </div>
            </div>
            <div className="carousel-indicators">
              {bestBooks.map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${
                    index === currentIndex ? "active" : ""
                  }`}
                  onClick={() => handleIndicatorClick(index)}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <p>베스트 도서 준비 중!</p>
      )}
    </div>
  );
};

export default BestBook;
