import React, { useEffect, useRef, useState } from "react";
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
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await api.get("/user-data");
        setUserId(userResponse.data.userId); // 사용자 ID 저장
      } catch (err) {
        console.error("사용자 데이터 가져오기 실패: ", err);
        alert("사용자 데이터를 가져오는 데 실패했습니다.");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/books/${bookId}/content`, {
          responseType: "arraybuffer",
          headers: { Accept: "application/epub+zip" },
        });

        if (response.status === 200) {
          const arrayBuffer = response.data;
          const book = ePub(arrayBuffer);

          book.on("error", (error) => {
            console.error("ePub error:", error);
          });

          await book.loaded.metadata;
          console.log("Book metadata loaded.");

          await book.ready;
          console.log("Book ready.");

          // 전체 페이지 수 계산
          await book.locations.generate(1600); // 1600은 기준점(텍스트 길이 기준)
          setTotalPages(book.locations.total);

          setBookInstance(book);
        } else {
          console.error("Invalid response type or status.");
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
        rendition.destroy();
        setRendition(null);
      }
    };
  }, [bookId]);

  useEffect(() => {
    let resizeObserver; // ResizeObserver 선언

    const renderBook = async () => {
      if (bookInstance && bookRef.current) {
        try {
          if (rendition) {
            console.log("Destroying previous rendition...");
            rendition.destroy();
            setRendition(null);
          }

          await bookInstance.ready;
          console.log("Book ready.");

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

          const handleResize = debounce(() => {
            if (newRendition) {
              try {
                newRendition.resize();
              } catch (error) {
                console.warn("Failed to resize rendition:", error);
              }
            }
          }, 500);

          const resizeObserver = new ResizeObserver(() => {
            handleResize();
          });

          resizeObserver.observe(bookRef.current);

          const updateLocation = () => {
            requestAnimationFrame(() => {
              const location = newRendition.currentLocation();
              console.log("Current Location:", location);

              if (location?.start?.cfi) {
                const currentPage = bookInstance.locations.percentageFromCfi(
                  location.start.cfi
                );
                setCurrentPage(currentPage);

                const progressPercentage = currentPage * 100;
                setProgress(progressPercentage);
              } else {
                console.warn("Location or CFI is undefined.");
              }
            });
          };

          newRendition.on("rendered", (section) => {
            console.log("Section rendered:", section);
            updateLocation();
          });

          newRendition.on("relocated", (location) => {
            console.log("Relocated to:", location);
            updateLocation();
          });

          console.log("Rendition instance created and listener attached.");

          await bookInstance.spine.ready;
          const spineItems = bookInstance.spine?.spineItems;
          if (spineItems?.length > 0) {
            console.log("Displaying first spine item:", spineItems[0].href);
            await newRendition.display(spineItems[0]?.href);
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
      if (resizeObserver) {
        resizeObserver.disconnect(); // ResizeObserver 해제
      }
      if (rendition) {
        rendition.destroy();
      }
    };
  }, [bookInstance]);

  // 진도율이 변경될 때마다 저장하는 로직 추가
  useEffect(() => {
    const saveProgress = async () => {
      if (progress > 0 && isAuthenticated && userId) {
        try {
          // 확인: 데이터가 올바른 형식인지 검토

          const lastReadPage = (progress / 100) * 100;

          const response = await api.put(`/bookshelf/completeBook`, null, {
            params: {
              userId: userId,
              bookId: bookId,
              lastReadPage: lastReadPage, // 데이터 형식 조정
            },
          });
          console.log("Progress saved successfully.", response.data);
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

        const url = new URL(`/bookshelf/completeBook`, window.location.origin);
        url.searchParams.append("userId", userId);
        url.searchParams.append("bookId", bookId);
        url.searchParams.append("lastReadPage", lastReadPage); // float 형식으로 저장

        // `sendBeacon`을 사용하여 데이터를 전송
        navigator.sendBeacon(url, null); // `sendBeacon`은 본문을 지원하지 않으므로 URL로만 데이터 전송
      }
    };

    // 로그아웃 시 호출될 함수
    const wrappedLogout = async () => {
      if (progress > 0 && isAuthenticated && userId) {
        const lastReadPage = (progress / 100) * 100;
        try {
          await api.put(`/bookshelf/completeBook`, null, {
            params: {
              userId: userId,
              bookId: bookId,
              lastReadPage: lastReadPage, // float 형식으로 저장
            },
          });
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
  }, [progress, isAuthenticated, userId, bookId, logout]);

  /*진도율 100이면 독서 완료
  useEffect(() => {
    if (progress === 100 && isAuthenticated && userId) {
      const markBookAsCompleted = async () => {
        try {
          await api.put(`/bookshelf/completeBook`, {
            userId: userId,
            bookId: bookId,
          });
          console.log("Book marked as completed.");
        } catch (error) {
          console.error("Error marking book as completed:", error);
        }
      };

      markBookAsCompleted();
    }
  }, [progress, isAuthenticated, userId, bookId]); */

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
      const cfi = bookInstance.locations.cfiFromPercentage(indexProgress / 100);
      await rendition.display(cfi);
      setProgress(indexProgress);
    }
  };

  return (
    <div className="book-reader">
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
          {isIndex ? <FaBookmark /> : <FaRegBookmark />}
        </button>
      </div>
      <button className="nav-button right" onClick={handleNextPage}>
        다음
      </button>
      <button
        className={`view-indexes ${showIndexes ? "active" : ""}`}
        onClick={handleViewIndexes}
      >
        {showIndexes ? "-" : "+"}
      </button>
      {showIndexes && (
        <div className="indexes-list">
          <div>Index List</div>
          <ul>
            {indexes.map((id, index) => (
              <li
                key={index}
                className="index-progress"
                onClick={() => handleIndexClick(id.progress)}
              >
                - {Math.round(id.progress.toFixed(2))}%
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <div className="progress-text" style={{ left: `${progress}%` }}>
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

export default BookReader;
