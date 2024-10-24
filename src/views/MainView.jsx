import React from "react";
import {
  Header2,
  MainNav,
  NewBook,
  BestBook,
  FamousBook,
  RecommendBook,
} from "components";

const MainView = () => {
  return (
    <>
      <Header2 />
      <div className="container">
        <MainNav />

        <div className="mainview_content">
          <div className="mainview_wrapper">
            <BestBook />
          </div>

          <div className="mainview_wrapper">
            <RecommendBook />
          </div>

          <div className="mainview_wrapper">
            <hr className="mainview_line" />
            <NewBook />
          </div>

          <div className="mainview_wrapper">
            <hr className="mainview_line" />
            <FamousBook />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainView;
