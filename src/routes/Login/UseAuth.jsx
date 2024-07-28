import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authtoken");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);
};

export default useAuth;
