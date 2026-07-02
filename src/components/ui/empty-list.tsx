import Image from "next/image";

export default function EmptyList({ text }: { text?: string }) {
  return (
    <div className="flex justify-center items-center h-full p-5">
      <div className="flex flex-col items-center space-y-5">
        <Image src="/assets/empty-folder.png" alt="Empty list" width={50} height={50} />
        <p className="text-muted-foreground">{text || "No items found"}</p>
      </div>
    </div>
  )
}