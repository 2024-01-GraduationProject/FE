import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import chatbot from "assets/img/chatbot_nobg.png";
import chatbot2 from "assets/img/chatbot2_nobg.png";
import chatbot3 from "assets/img/chatbot3_nobg.png";

const BoogiChatbot = () => {
  const { bookId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, bookTitle, bookAuthor } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNextQuestionButtons, setShowNextQuestionButtons] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  // useRef를 사용하여 처음 렌더링 시 한 번만 실행되도록 설정
  const hasFetchedQuestion = useRef(false);

  useEffect(() => {
    // 첫 번째 렌더링 시만 실행되도록 설정
    if (!hasFetchedQuestion.current) {
      hasFetchedQuestion.current = true;

      const encodedBookTitle = encodeURIComponent(bookTitle);
      // 책 완독 축하 메시지와 첫 질문을 가져옴
      api
        .get(
          `${process.env.REACT_APP_SERVER_URL}/boogi/ask-question/${userId}/${encodedBookTitle}`
        )
        .then((response) => {
          // 응답이 문자열인지 배열인지 확인
          if (Array.isArray(response.data)) {
            const messagesArray = response.data.map((item) => ({
              sender: "boogi",
              text: item, // item은 배열의 각 요소 (질문 텍스트 등)
            }));
            setMessages((prevMessages) => [...prevMessages, ...messagesArray]);
          } else {
            // 응답이 문자열일 경우 처리
            setMessages((prevMessages) => [
              ...prevMessages,
              { sender: "boogi", text: response.data },
            ]);
          }
        })
        .catch((error) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: "boogi",
              text: "질문을 가져오는 중 오류가 발생했습니다.",
            },
          ]);
        });
    }
  }, [userId, bookTitle]);

  const handleSend = () => {
    if (userInput.trim() === "") return;

    // 사용자 입력 메시지 추가
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: userInput },
    ]);

    setLoading(true); // 로딩 상태 활성화
    setShowTypingIndicator(true);

    // 답변 전송 후 챗봇 응답
    setTimeout(() => {
      api
        .post(`${process.env.REACT_APP_SERVER_URL}/boogi/answer`, userInput, {
          params: {
            userId,
            question: messages[messages.length - 1].text,
            bookTitle,
            bookId,
          },
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          // 응답이 배열인지 확인
          if (Array.isArray(response.data)) {
            const messagesArray = response.data.map((item) => ({
              sender: "boogi",
              text: item,
            }));
            setMessages((prevMessages) => [...prevMessages, ...messagesArray]);
          } else {
            setMessages((prevMessages) => [
              ...prevMessages,
              { sender: "boogi", text: response.data },
            ]);
          }
          // 질문이 모두 끝난 경우 완료 상태로 설정
          if (response.data.includes("모두 마쳤어")) {
            setIsCompleted(true);
            setShowTypingIndicator(false);
          } else {
            setShowNextQuestionButtons(true);
          }
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "답변 처리 중 오류가 발생했습니다.";

          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "boogi", text: errorMessage },
          ]);
        })

        .finally(() => {
          // 사용자 답변을 DB에 저장
          api
            .post(`${process.env.REACT_APP_SERVER_URL}/boogi/save-answer`, {
              userId,
              bookId,
              answer: userInput,
            })
            .then((response) => {
              console.log(response.data); // 저장 성공 메시지
            })
            .catch((error) => {
              // save-answer API 에러 처리
              const saveErrorMessage =
                error.response?.data?.message ||
                error.message ||
                "답변 저장 중 오류가 발생했습니다.";
              console.error("Error saving answer:", saveErrorMessage);
            })
            .finally(() => {
              setLoading(false); // 로딩 상태 비활성화
              setUserInput(""); // 입력 필드 초기화
              setShowTypingIndicator(false);
            });
        });
    }, 500);
  };

  const handleNextQuestion = (response) => {
    setLoading(true); // 로딩 상태 활성화
    setShowNextQuestionButtons(false); // 버튼 사라지게 하기
    setShowTypingIndicator(true);

    setTimeout(() => {
      api
        .post(`${process.env.REACT_APP_SERVER_URL}/boogi/next-question`, null, {
          params: {
            userId,
            response,
            bookTitle,
          },
        })
        .then((res) => {
          // 응답을 문자열로 받아와 직접 메시지로 사용
          const message = res.data;
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "boogi", text: message },
          ]);

          // 응답에 따라 대화 종료 여부 설정
          if (
            message.includes("질문을 모두 마쳤어") ||
            message.includes("대화를 마칠게")
          ) {
            setIsCompleted(true);
            setShowTypingIndicator(false);
          }
        })
        .catch((error) => {
          // error.response가 존재하는지 확인
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "추가 질문 처리 중 오류가 발생했습니다.";
          console.error("Error response:", errorMessage);
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "boogi", text: errorMessage },
          ]);
        })
        .finally(() => {
          setLoading(false); // 로딩 상태 비활성화
          setShowTypingIndicator(false);
        });
    }, 1000);
  };

  // 이미지 동적으로 설정
  const getChatbotImage = (index) => {
    if (index === 0) return chatbot; // 첫 번째 질문
    if (index > 0 && messages[index - 1].sender === "user") return chatbot2; // 사용자의 답변 이후
    return chatbot3; // 그 외의 경우
  };

  return (
    <>
      <div className="boogi-book-info">
        {"< "}
        {bookTitle} {" > "}| {bookAuthor}
      </div>
      <div className="chatbot-container-wrapper">
        <div className="chatbot-container">
          <div className="messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message-bubble ${
                  message.sender === "boogi" ? "left" : "right"
                } ${
                  message.sender === "boogi" && index === messages.length - 1
                    ? "show"
                    : ""
                }`}
              >
                {message.sender === "boogi" && (
                  <img
                    src={getChatbotImage(index)}
                    alt="chatbot_boogi"
                    className="chatbot_profile"
                  />
                )}
                {message.text}
                {message.sender === "boogi" &&
                  index === messages.length - 1 &&
                  showTypingIndicator && (
                    <div className="typing-indicator show">
                      <span>typing...</span>
                    </div>
                  )}
              </div>
            ))}
          </div>
          {!isCompleted && (
            <div className="input-container">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="답변을 입력하세요..."
                disabled={loading || showNextQuestionButtons} // 로딩 중에는 입력 비활성화
              />
              <button onClick={handleSend} disabled={loading}>
                {loading ? "전송 중..." : "전송"}
              </button>
            </div>
          )}
          {!isCompleted && showNextQuestionButtons && (
            <div className="next-question-buttons">
              <button
                onClick={() => handleNextQuestion("YES")}
                disabled={loading}
              >
                예
              </button>
              <button
                onClick={() => handleNextQuestion("NO")}
                disabled={loading}
              >
                아니오
              </button>
            </div>
          )}
          {isCompleted && (
            <div className="end-buttons">
              <button onClick={() => navigate("/mylib")}>내 서재📚 가기</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BoogiChatbot;
