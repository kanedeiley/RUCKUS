import Link from "next/link";

export default function RoomNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center text-foreground">
      <h1 className="text-3xl font-black uppercase">Room not found</h1>
      <p className="text-muted">That room code doesn&apos;t exist or the game has ended.</p>
      <Link href="/join" className="font-semibold text-primary underline">
        Try another code
      </Link>
    </main>
  );
}
