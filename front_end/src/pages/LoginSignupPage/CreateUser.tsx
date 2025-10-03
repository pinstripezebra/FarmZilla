import api from "../../services/apli-client";

interface CreateUserPayload {
  username: string;
  password: string;
  email: string;
  role: string;
}

export const createUser = ({
  username,
  password,
  email,
  role = "consumer",
}: CreateUserPayload) => {
  console.log({
    username,
    password,
    email,
    role: role || "consumer",
  });

  const validRoles = ["producer", "consumer"];
  const safeRole = validRoles.includes(role) ? role : "consumer";
  return api.post("/v1/user/", {
    username,
    password,
    email,
    role: safeRole,
  });
};
