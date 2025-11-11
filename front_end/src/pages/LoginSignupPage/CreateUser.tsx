import api from "../../services/apli-client";

interface CreateUserPayload {
  username: string;
  password: string;
  email: string;
  role: string;
  location?: string; // Optional location field
}

export const createUser = ({
  username,
  password,
  email,
  role = "consumer",
  location,
}: CreateUserPayload) => {
  console.log({
    username,
    password,
    email,
    role: role || "consumer",
    location,
  });

  const validRoles = ["producer", "consumer"];
  const safeRole = validRoles.includes(role) ? role : "consumer";
  
  const payload: any = {
    username,
    password,
    email,
    role: safeRole,
  };
  
  // Add location if provided
  if (location) {
    payload.location = location;
  }
  
  return api.post("/v1/user/", payload);
};
