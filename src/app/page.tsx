import { redirect } from "next/navigation";

export default function Home() {
  // The middleware already gates auth; signed-in users land on the tender list.
  redirect("/tenders");
}
