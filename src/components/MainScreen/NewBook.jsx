import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const NewBook = () => {
  const [books, setBooks] = useState([]); // 신간 8권 저장하는 상태
  const navigate = useNavigate();

  useEffect(() => {
    // 컴포넌트가 마운트될 때 책 목록을 가져옴
    const fetchBooks = async () => {
      try {
        const response = await api.get(`/books`);
        // 책 목록을 출판일 기준으로 내림차순 정렬
        const sortedBooks = response.data
          .sort(
            (a, b) => new Date(b.publicationDate) - new Date(a.publicationDate)
          )
          .slice(0, 4); // 상위 4권만 추출

        // 필요한 정보만 추출하여 상태에 저장
        const bookData = sortedBooks.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          coverImageUrl: book.coverImageUrl,
          publicationDate: book.publicationDate,
        }));
        setBooks(bookData);
      } catch (error) {
        console.error("Failed to fetch books", error);
      }
    };

    fetchBooks();
  }, []);

  const goToBookDetail = (id) => {
    navigate(`/books/details/${id}`);
  };

  return (
    <div className="booklist-wrapper">
      <div className="main-booklist-component">
        <strong className="highlightNew">New! </strong>{" "}
        <span class="groupingText">새로 들어온 책</span>
      </div>

      <div className="newbook-list-wrapper">
        <div className="book-list">
          {books.map((book) => (
            <div
              key={book.id}
              className="newbook-item"
              onClick={() => goToBookDetail(book.id)}
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
                <p className="book-author">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewBook;
