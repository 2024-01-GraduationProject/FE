import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header2, SearchBar, MainNav } from "components";
import { useAuth } from "AuthContext";

const SearchList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchResults, setSearchResults] = useState([]); // 검색 결과 상태
  const [searchWord, setSearchWord] = useState(""); // 검색어 상태

  useEffect(() => {
    // 검색 결과가 state로 전달된 경우에 처리
    if (location.state && location.state.searchResults) {
      setSearchResults(location.state.searchResults);
      setSearchWord(location.state.searchWord);
    }
  }, [location.state]);

  if (!isAuthenticated) {
    return <div>로딩 중...</div>; // 로딩 중 메시지 표시
  }

  const hasResults = searchResults.length > 0;

  return (
    <>
      <Header2 />
      <div className="container">
        <MainNav />
        {/*<hr className="mainview_line" />*/}
        {/* 검색 결과 표시 */}
        <div id="searchResults">
          {hasResults ? (
            <>
              <h2>
                "<span className="searchWord">{searchWord}</span>" 검색
                결과입니다.
              </h2>
              <div className="mainview_wrapper">
                <div className="booksGrid">
                  {searchResults.map((book) => (
                    <div key={book.book_id} className="bookItem">
                      <div className="searchList-book-cover-wrapper">
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="bookCover"
                          onClick={() =>
                            navigate(`/books/details/${book.bookId}`)
                          }
                        />
                      </div>
                      <div className="bookInfo">
                        <h3>{book.title}</h3>
                        <p>
                          {book.author} | {book.publisher}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="noResultsMessage">
              "<span className="searchWord">{searchWord}</span>" 검색 결과가
              없습니다.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchList;
