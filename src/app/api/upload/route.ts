import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const extension = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${extension}`;
        const path = join(process.cwd(), "public", "uploads", fileName);

        await writeFile(path, buffer);
        console.log(`File uploaded to ${path}`);

        // Return the relative URL
        return NextResponse.json({ url: `/uploads/${fileName}` });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
