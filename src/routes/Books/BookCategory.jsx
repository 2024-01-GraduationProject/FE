import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header2, MainNav } from "components";
import api from "../../api";

const BookCategory = () => {
  const { categoryName } = useParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchBooksByCategory = async () => {
      try {
        // 해당 카테고리의 책 목록을 가져오기
        const booksResponse = await api.get(
          `${process.env.REACT_APP_SERVER_URL}/books/category/${categoryName}`
        );
        if (booksResponse.status !== 200) {
          throw new Error(
            `Network response was not ok. Status: ${booksResponse.status}`
          );
        }
        setBooks(booksResponse.data); // 가져온 데이터를 상태에 저장
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooksByCategory(); // 컴포넌트가 마운트되면 API를 호출
  }, [categoryName, location]); // categoryName이 변경될 때마다 데이터를 다시 가져옴

  const goToBookDetail = (id) => {
    navigate(`/books/details/${id}`);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading books: {error.message}</p>;

  return (
    <>
      <Header2 />
      <div className="container">
        <MainNav />
        <div className="bookCG-list-wrapper">
          <h2>{categoryName}</h2>
          <div className="bookCG-list">
            {books.length === 0 ? (
              <p className="bookCG-no-books">
                No books found in this category.
              </p>
            ) : (
              books.map((book) => (
                <div
                  key={book.id}
                  className="bookCG-item"
                  onClick={() => goToBookDetail(book.id)}
                >
                  <div className="category-book-cover-wrapper">
                    <img
                      src={book.coverImageUrl}
                      alt={`Cover of ${book.title}`}
                      className="book-cover"
                    />
                  </div>
                  <div className="bookCG-details">
                    <h2 className="bookCG-title">{book.title}</h2>
                    <p className="bookCG-author">
                      {book.author} | {book.publisher}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BookCategory;
