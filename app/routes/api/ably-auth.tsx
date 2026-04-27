import type { ActionFunctionArgs } from "react-router";
import jwt from "jsonwebtoken";
import Ably from "ably";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = import.meta.env.VITE_ABLY_API_KEY || import.meta.env.ABLY_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Ably API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [keyName, ...rest] = apiKey.split(":");
  const keySecret = rest.join(":");

  if (!keyName || !keySecret) {
    return new Response(JSON.stringify({ error: "Invalid Ably API key format" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = jwt.sign(
    {
      "x-ably-capability": JSON.stringify({
        "room:*": ["subscribe", "publish", "presence"],
        "watch-together:*": ["subscribe", "publish", "presence"],
      }),
    },
    keySecret,
    {
      expiresIn: "1h",
      keyid: keyName,
    }
  );

return new Response(token, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}