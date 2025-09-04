// 文件路径: /src/app/api/umami-stats/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 从环境变量获取配置
  const umamiBaseUrl = process.env.UMAMI_URL || 'https://www.umami.monstecho.top';
  const websiteId = process.env.WEBSITE_ID || 'a88d93ae-6c6e-46cf-a6cd-5a6a01b0caae';
  const umamiToken = process.env.UMAMI_TOKEN;

  // 检查 Token 是否存在
  if (!umamiToken) {
    return NextResponse.json(
      { error: 'Umami token not configured.' },
      { status: 500 }
    );
  }

  // 计算时间范围
  const now = new Date();
  const nowMs = now.getTime();
  
  // 今日开始时间
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStartMs = todayStart.getTime();
  
  // 昨日开始时间
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayStartMs = yesterdayStart.getTime();
  
  // 昨日结束时间
  const yesterdayEndMs = todayStartMs - 1;
  
  // 本月开始时间
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartMs = monthStart.getTime();
  
  // 今年开始时间
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearStartMs = yearStart.getTime();

  try {
    // 定义需要获取的数据端点
    const endpoints = {
      today: `/api/websites/${websiteId}/stats?startAt=${todayStartMs}&endAt=${nowMs}`,
      yesterday: `/api/websites/${websiteId}/stats?startAt=${yesterdayStartMs}&endAt=${yesterdayEndMs}`,
      month: `/api/websites/${websiteId}/stats?startAt=${monthStartMs}&endAt=${nowMs}`,
      year: `/api/websites/${websiteId}/stats?startAt=${yearStartMs}&endAt=${nowMs}`,
    };

    // 并发请求所有数据
    const data = await Promise.all(
      Object.values(endpoints).map(async (endpoint) => {
        const response = await fetch(`${umamiBaseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${umamiToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch from Umami: ${response.statusText}`);
        }
        
        return await response.json();
      })
    );

    // 提取并转换数据格式
    const [todayData, yesterdayData, monthData, yearData] = data;

    const result = {
      today_uv: todayData?.uniques?.value || 0,
      today_pv: todayData?.pageviews?.value || 0,
      yesterday_uv: yesterdayData?.uniques?.value || 0,
      yesterday_pv: yesterdayData?.pageviews?.value || 0,
      last_month_pv: monthData?.pageviews?.value || 0,
      last_year_pv: yearData?.pageviews?.value || 0,
    };

    // 创建响应并设置缓存头
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 's-maxage=300');
    
    return response;
  } catch (error) {
    console.error('Error fetching Umami data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics data.',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message }) 
      },
      { status: 500 }
    );
  }
}

// 确保路由是动态的
export const dynamic = 'force-dynamic';