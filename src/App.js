import React from "react";
import { BrowserRouter, Route, Routes, Switch } from "react-router-dom";

import HomeView from "./views/HomeView";
import {
  Join,
  Login,
  MyLib,
  MyPage,
  EditMyPage,
  Taste,
  TasteNext,
  BookDetail,
  BookReader,
  BookCategory,
  BoogiChatbot,
  CompletedBoogi,
} from "routes";
import { SearchList } from "components";
import MainView from "views/MainView";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/join" element={<Join />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mylib" element={<MyLib />} />
        <Route path="/taste" element={<Taste />} />
        <Route path="/mainview" element={<MainView />} />
        <Route path="/homeview" element={<HomeView />} />
        <Route path="/editmypage" element={<EditMyPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/tastenext" element={<TasteNext />} />
        <Route path="/books/details/:bookId" element={<BookDetail />} />
        <Route
          path="/books/category/:categoryName"
          element={<BookCategory />}
        />
        <Route path="/books/:bookId/content" element={<BookReader />} />
        <Route path="/books/:bookId/boogi" element={<BoogiChatbot />} />
        <Route path="/searchlist" element={<SearchList />} />
        <Route
          path="/boogi/answers/:userId/:bookId"
          element={<CompletedBoogi />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
