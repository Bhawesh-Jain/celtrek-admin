import { apiError, apiFailure } from "@/lib/api/api-helper";
import { FileRepository } from "@/lib/repositories/sys/fileRepository";
import { createReadStream, existsSync } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream"; // Import Readable from stream
import { File } from "fetch-blob/file.js";

export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  const id = params.id;
  if (!id) {
    return apiFailure({ message: ["Invalid request: missing file id."] });
  }

  try {
    const { success, result, message: error } = await new FileRepository("1").getFileRecord(id);
    
    if (!success) {
      return apiFailure({ message: [error] });
    }
    const absolutePath = path.join(process.cwd(), result.path);    

    if (!existsSync(absolutePath)) {
      return apiFailure({ message: ["File not found on disk."] });
    }

    // Convert Node.js ReadStream to Web ReadableStream
    const nodeStream = createReadStream(absolutePath);
    const webStream = Readable.toWeb(nodeStream);

    const headers = new Headers({
      "Content-Type": result.file_mime,
    });

    return new NextResponse(webStream as BodyInit, { headers }); // Use converted stream
  } catch (err: any) {
    return apiError({
      origin: "/app/api/uploads/[id]",
      error: err.message || err,
    });
  }
}