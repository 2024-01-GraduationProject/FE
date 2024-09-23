import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ePub from "epubjs";
import api from "../../api";
import { debounce } from "debounce";
import { useAuth } from "../../AuthContext";
import {
  FaRegArrowAltCircleLeft,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa"; // 아이콘 임포트
import { MdOutlineExpandCircleDown } from "react-icons/md";

const BookReader = () => {
  const { bookId } = useParams();

  const bookRef = useRef(null);
  const [rendition, setRendition] = useState(null);
  const [progress, setProgress] = useState(0);
  const [bookInstance, setBookInstance] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [indexes, setIndexes] = useState([]);
  const [showIndexes, setShowIndexes] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isBookReady, setIsBookReady] = useState(false);
  const [bookTitle, setBookTitle] = useState(""); // 책 제목 상태 추가
  const [bookAuthor, setBookAuthor] = useState("");
  const { isAuthenticated, logout } = useAuth();
  const [lastReadCFI, setLastReadCFI] = useState(null);
  const [isBookCompleted, setIsBookCompleted] = useState(false); // 책 완독 상태 추가
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await api.get(
          `${process.env.REACT_APP_SERVER_URL}/user-data`
        );
        setUserId(userResponse.data.userId); // 사용자 ID 저장
      } catch (err) {
        alert("사용자 데이터를 가져오는 데 실패했습니다.");
        navigate("/login");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(
          `${process.env.REACT_APP_SERVER_URL}/books/${bookId}/content`,
          {
            responseType: "arraybuffer",
            headers: { Accept: "application/epub+zip" },
          }
        );

        const bookDetailResponse = await api.get(
          `${process.env.REACT_APP_SERVER_URL}/books/${bookId}`
        );
        setBookTitle(bookDetailResponse.data.title);
        setBookAuthor(bookDetailResponse.data.author);

        if (response.status === 200) {
          const arrayBuffer = response.data;
          const book = ePub(arrayBuffer);

          book.on("error", (error) => {
            console.error("ePub error:", error);
          });

          await book.loaded.metadata;

          await book.ready;

          // 전체 페이지 수 계산
          await book.locations.generate(2000); // 2000은 기준점(텍스트 길이 기준)
          setTotalPages(book.locations.total);

          setBookInstance(book);
          setIsBookReady(true);
        }
      } catch (error) {
        console.error("Failed to fetch book data:", error);
      }
    };

    if (bookId) {
      fetchBook();
    }

    return () => {
      if (rendition) {
        if (rendition.destroy) {
          rendition.destroy();
        }
        setRendition(null);
      }
    };
  }, [bookId]);

  useEffect(() => {
    if (isBookCompleted) {
      navigate(`/books/${bookId}/boogi`, {
        state: { userId, bookTitle, bookAuthor },
      });
    }
  }, [isBookCompleted, bookId, userId, bookTitle, bookAuthor, navigate]);

  useEffect(() => {
    const renderBook = async () => {
      if (bookInstance && bookRef.current) {
        try {
          if (rendition) {
            if (rendition.destroy) {
              rendition.destroy();
            }
            setRendition(null);
          }

          await bookInstance.ready;

          // spine이 준비되었는지 확인
          await bookInstance.spine.ready;

          const newRendition = bookInstance.renderTo(bookRef.current, {
            width: "100%",
            height: "100%",
            flow: "paginated",
            allowScriptedContent: true,
            interaction: {
              enabled: true,
            },
          });

          setRendition(newRendition);

          try {
            // 예를 들어, start() 호출 시 발생할 수 있는 예외 처리
            await newRendition.start(); // (이 부분은 ePub.js 라이브러리의 API에 따라 다를 수 있음)
          } catch (error) {
            console.error("Error starting rendition:", error);
          }

          const handleResize = debounce(() => {
            if (newRendition) {
              newRendition.resize();
            }
          }, 200);

          const fetchLastReadPage = async () => {
            try {
              // 현재 읽고 있는 책의 데이터 가져오기
              const readingResponse = await api.get(
                `${process.env.REACT_APP_SERVER_URL}/bookshelf/reading`,
                {
                  params: { userId },
                }
              );
              // 독서 완료 중 lastReadPage가 100이 아닌 책 가져오기
              const completedResponse = await api.get(
                `${process.env.REACT_APP_SERVER_URL}/bookshelf/completed`,
                {
                  params: { userId },
                }
              );

              if (
                readingResponse.status === 200 &&
                readingResponse.data.length > 0
              ) {
                const userBook = readingResponse.data.find(
                  (book) => book.bookId === parseInt(bookId)
                );

                if (userBook) {
                  const lastReadPage = userBook.lastReadPage / 100; // 페이지 비율로 변환
                  const cfi =
                    bookInstance.locations.cfiFromPercentage(lastReadPage);

                  if (cfi) {
                    setLastReadCFI(cfi); // CFI를 상태에 저장
                  } else {
                    console.warn("Invalid CFI generated.");
                  }
                }
              }

              // 완료된 책에서 lastReadPage가 100 미만인 경우 확인
              if (
                completedResponse.status === 200 &&
                completedResponse.data.length > 0
              ) {
                const completedBook = completedResponse.data.find(
                  (book) =>
                    book.bookId === parseInt(bookId) && book.lastReadPage < 100
                );

                if (completedBook) {
                  const lastReadPage = completedBook.lastReadPage / 100; // 페이지 비율로 변환
                  const cfi =
                    bookInstance.locations.cfiFromPercentage(lastReadPage);

                  if (cfi) {
                    setLastReadCFI(cfi);
                    await rendition.display(cfi); // 마지막 읽은 페이지부터 렌더링
                  } else {
                    console.warn("Invalid CFI generated for completed book.");
                  }
                }
              }
            } catch (error) {
              console.error("Failed to fetch last read page:", error);
            }
          };

          const updateLocation = () => {
            requestAnimationFrame(() => {
              const location = newRendition.currentLocation();

              if (location?.start?.cfi) {
                const currentPage = bookInstance.locations.percentageFromCfi(
                  location.start.cfi
                );
                setCurrentPage(currentPage);

                const progressPercentage = currentPage * 100;
                setProgress(progressPercentage);

                // 진도율이 100% 이면 완독
                if (progressPercentage === 100) {
                  setTimeout(() => {
                    setIsBookCompleted(true);
                  }, 2000); // 마지막 페이지에서 2초 머물기
                }
              } else {
                console.warn("Location or CFI is undefined.");
              }
            });
          };

          newRendition.on("rendered", async (section) => {
            updateLocation();

            await bookInstance.ready;

            setTimeout(async () => {
              await fetchLastReadPage();
            }, 1000); // Adjust delay if necessary
          });

          newRendition.on("relocated", (location) => {
            updateLocation();
          });

          await bookInstance.spine.ready;

          const spineItems = bookInstance.spine?.spineItems;
          if (spineItems?.length > 0) {
            const cfiToDisplay = lastReadCFI || spineItems[0]?.href;

            await newRendition.display(cfiToDisplay);
            console.log("Book displayed.");
          } else {
            console.error("No spine items found.");
          }
        } catch (error) {
          console.error("Error in rendering book:", error);
        }
      }
    };

    renderBook();

    return () => {
      if (rendition) {
        try {
          if (rendition.destroy) {
            rendition.destroy();
          }
        } catch (error) {
          console.error("Error destroying rendition:", error);
        }
        setRendition(null); // 상태 초기화
      }
    };
  }, [bookInstance, isBookReady]);

  // 키보드 이벤트 리스너 추가
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        handleNextPage(); // 오른쪽 화살표 키로 다음 페이지
      } else if (event.key === "ArrowLeft") {
        handlePreviousPage(); // 왼쪽 화살표 키로 이전 페이지
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (window.removeEventListener) {
        window.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [rendition]);

  // 진도율이 변경될 때마다 저장하는 로직 추가
  useEffect(() => {
    const saveProgress = async () => {
      if (progress > 0 && isAuthenticated && userId) {
        try {
          // 확인: 데이터가 올바른 형식인지 검토

          const lastReadPage = progress;

          const response = await api.put(
            `${process.env.REACT_APP_SERVER_URL}/bookshelf/completeBook`,
            null,
            {
              params: {
                userId: userId,
                bookId: bookId,
                lastReadPage: lastReadPage, // 데이터 형식 조정
                indices: indexes.map((index) => index.progress), // 인덱스 리스트
              },
              paramsSerializer: (params) => {
                const queryString = new URLSearchParams();
                queryString.append("userId", params.userId);
                queryString.append("bookId", params.bookId);
                queryString.append("lastReadPage", params.lastReadPage);
                params.indices.forEach((index, i) => {
                  queryString.append(`indices[${i}]`, index); // 여기서 인덱스를 인코딩
                });
                return queryString.toString();
              },
            }
          );
        } catch (error) {
          console.error(
            "Error saving progress:",
            error.response?.data || error.message
          );
        }
      }
    };

    saveProgress();
  }, [progress, isAuthenticated, userId, bookId]);

  // 창을 나가기 전 또는 로그아웃 시 진도율 저장
  useEffect(() => {
    // `beforeunload` 이벤트 핸들러
    const handleBeforeUnload = () => {
      if (progress > 0 && isAuthenticated && userId) {
        const lastReadPage = (progress / 100) * 100;

        const url = new URL(
          `${process.env.REACT_APP_SERVER_URL}/bookshelf/completeBook`,
          window.location.origin
        );
        url.searchParams.append("userId", userId);
        url.searchParams.append("bookId", bookId);
        url.searchParams.append("lastReadPage", lastReadPage); // float 형식으로 저장

        // 인덱스 리스트를 URL 파라미터로 추가하면서 인코딩
        indexes.forEach((index, i) => {
          url.searchParams.append(
            `indices%5B${i}%5D`,
            encodeURIComponent(index.progress)
          );
        });

        // `sendBeacon`을 사용하여 데이터를 전송
        navigator.sendBeacon(url, null); // `sendBeacon`은 본문을 지원하지 않으므로 URL로만 데이터 전송
      }
    };

    // 로그아웃 시 호출될 함수
    const wrappedLogout = async () => {
      if (progress > 0 && isAuthenticated && userId) {
        const lastReadPage = (progress / 100) * 100;
        try {
          await api.put(
            `${process.env.REACT_APP_SERVER_URL}/bookshelf/completeBook`,
            null,
            {
              params: {
                userId: userId,
                bookId: bookId,
                lastReadPage: lastReadPage, // float 형식으로 저장
                indices: indexes.map((index) =>
                  parseFloat(index.progress).toFixed(1)
                ),
              },

              paramsSerializer: (params) => {
                const queryString = new URLSearchParams();
                queryString.append("userId", params.userId);
                queryString.append("bookId", params.bookId);
                queryString.append("lastReadPage", params.lastReadPage);
                params.indices.forEach((index, i) => {
                  const formattedIndex = parseFloat(index).toFixed(1); // 소수점 첫째자리로 변환
                  queryString.append(
                    `indices[${i}]`,
                    encodeURIComponent(formattedIndex)
                  ); // 인코딩
                });

                return queryString.toString();
              },
            }
          );
          console.log("Progress saved before logout.");
        } catch (error) {
          console.error("Error saving progress before logout:", error);
        }
      }
      logout(); // 실제 로그아웃 수행
    };

    // 이벤트 리스너 등록
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [progress, indexes, isAuthenticated, userId, bookId, logout]);

  const handleNextPage = () => {
    if (rendition) {
      rendition?.next();
    } else {
      console.warn("Rendition is not initialized.");
    }
  };

  const handlePreviousPage = () => {
    if (rendition) {
      rendition?.prev();
    } else {
      console.warn("Rendition is not initialized.");
    }
  };

  const handleBack = () => {
    navigate(-1); // 이전 페이지로 돌아가기
  };

  const toggleIndex = () => {
    if (!isAuthenticated) {
      console.warn("User must be authenticated to bookmark.");
      return;
    }

    const newIndex = { progress }; // 현재 페이지 진도율 저장

    setIndexes((prevIndexes) => {
      // 인덱스 추가 또는 제거
      const index = prevIndexes.findIndex(
        (b) => b.progress === newIndex.progress
      );
      if (index > -1) {
        return prevIndexes.filter((_, i) => i !== index); // 북마크 제거
      } else {
        return [...prevIndexes, newIndex]; // 인덱스 추가
      }
    });
  };

  const handleViewIndexes = () => {
    setShowIndexes((prev) => !prev); // 인덱스 메뉴 표시 상태 토글
  };

  const isIndex = indexes.some((b) => b.progress === progress);

  const handleIndexClick = async (indexProgress) => {
    if (bookInstance && rendition) {
      const cfi = bookInstance.locations.cfiFromPercentage(
        (indexProgress / 100).toFixed(1)
      );
      await rendition.display(cfi);
      setProgress(indexProgress);
      console.log(
        "Indices to be saved:",
        indexes.map((index) => index.progress)
      );
    }
  };

  return (
    <div className="book-reader">
      {isBookCompleted ? (
        <></>
      ) : (
        <>
          <button className="back-button" onClick={handleBack}>
            <FaRegArrowAltCircleLeft />
          </button>
          <button className="nav-button left" onClick={handlePreviousPage}>
            이전
          </button>
          <div ref={bookRef} className="book-container">
            <button
              className={`index-button ${isIndex ? "active" : ""}`}
              onClick={toggleIndex}
              disabled={!isAuthenticated} // 인증되지 않은 경우 버튼 비활성화
            >
              {/*{isIndex ? <FaBookmark /> : <FaRegBookmark />}*/}
            </button>
          </div>
          <button className="nav-button right" onClick={handleNextPage}>
            다음
          </button>

          <button
            className={`view-indexes ${showIndexes ? "active" : ""}`}
            onClick={handleViewIndexes}
          >
            {showIndexes ? <FaRegBookmark /> : <FaBookmark />}
          </button>
          {/*{showIndexes && (
            <div className="indexes-list">
              <span className="bookmark-title"> 책갈피 </span>
              <ul>
                {indexes.map((id, index) => (
                  <li
                    key={index}
                    className="index-progress"
                    onClick={() => handleIndexClick(id.progress)}
                  >
                    {id.progress.toFixed(1)}%
                  </li>
                ))}
              </ul>
            </div>
          )}*/}
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
            <div className="progress-text" style={{ left: `${progress}%` }}>
              {progress.toFixed(1)}%
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BookReader;
