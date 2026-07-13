import { redirect } from "next/navigation";

/** Hearing is hidden for now — send users to home. */
export default function HearingPage() {
  redirect("/dashboard");
}
