import { NextResponse } from "next/server";

export async function GET() {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500">
        <rect width="100%" height="100%" fill="white"/>
        <text
            x="500"
            y="250"
            font-size="80"
            text-anchor="middle"
            fill="black">
            Hello World
        </text>
    </svg>`;

    return new NextResponse(svg, {
        headers: {
            "Content-Type": "image/svg+xml"
        }
    });
}
