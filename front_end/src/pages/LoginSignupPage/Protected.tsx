import { useEffect } from "react";
import { useNavigate } from "react-router-dom";



function ProtectedPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
        const token = localStorage.getItem("token");
        console.log("Token in ProtectedPage:", token);
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/v1/verify/${token}`)
            if (!response.ok) {
                throw new Error("Token verification failed");
            }
        } catch (error) {
            console.error("Error verifying token:", error);
            localStorage.removeItem("token");
            navigate("/login");
        }

    }

    verifyToken();
  }, [navigate]);
}

export default ProtectedPage;