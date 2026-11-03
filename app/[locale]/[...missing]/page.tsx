import { notFound } from "next/navigation";

// Every unknown path, after the proxy's locale rewrite (/tk/anything), and
// the proxy's own 404s for dead city and member links. Sends them to the
// translated not-found page in this segment.
export default function Missing() {
  notFound();
}
