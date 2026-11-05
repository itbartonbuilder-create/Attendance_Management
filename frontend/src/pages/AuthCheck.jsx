import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AuthCheck() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      navigate("/login");
      return;
    }

    const userData = JSON.parse(user);

   
    if (userData.role === "vendor") {
      navigate("/vendor-dashboard");
    } 
    else {
      navigate("/dashboard");
    }
  }, []);

  return <h2 style={{padding:20}}>Checking Login...</h2>;
}

export default AuthCheck;
