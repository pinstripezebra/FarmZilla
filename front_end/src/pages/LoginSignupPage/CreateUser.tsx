import api from "../../services/apli-client";

interface CreateUserPayload {
  username: string;
  password: string;
  email: string;
  role?: string; 
}

export const createUser = ({ username, password, email, role = "user" }: CreateUserPayload) => {
  console.log({
    username,
    password,
    email,
    role: role || "user"
  })
  
  return api.post("/v1/user/", {
    username,
    password,
    email,
    role: role || "user"
  });
};