import { Separator } from "@/components/ui/separator";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <header className="flex h-16 shrink-0 sticky top-0 bg-background items-center gap-2">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <Separator orientation="vertical" className="h-5" />
      </header>
      <div className="text-center">
        <p className="text-lg">Sorry, the page you are looking for does not exist.</p>
        <p className="text-sm">You can go back to the dashboard or check the links.</p>
      </div>
    </div>
  );
}