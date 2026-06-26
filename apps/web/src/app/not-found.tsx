import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-4xl font-bold">404 - Not Found</h2>
      <p className="mt-4">Could not find requested resource</p>
      <Link href="/" className="mt-6 text-blue-500 hover:underline">
        Return Home
      </Link>
    </div>
  );
}
