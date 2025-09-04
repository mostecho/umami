import { NextResponse } from 'next/server';

export async function GET() {
  // 简单测试响应
  return NextResponse.json({ 
    message: "API is working",
    timestamp: new Date().toISOString()
  });
}

export const dynamic = 'force-dynamic';