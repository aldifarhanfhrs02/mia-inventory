import { redirect } from "next/navigation";

/** Root route — the app lives under /dashboard once auth lands. */
export default function Home() {
  redirect("/dashboard");
}
