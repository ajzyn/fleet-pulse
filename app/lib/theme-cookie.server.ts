import { createCookie } from "react-router";

export type Appearance = "light" | "dark";

export const themeCookie = createCookie("theme", {
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax",
});

export async function getTheme(request: Request): Promise<Appearance> {
  const value = (await themeCookie.parse(request.headers.get("Cookie"))) as Appearance | null;
  return value ?? "dark";
}
