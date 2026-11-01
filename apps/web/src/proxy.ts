import { NextResponse, type NextRequest } from 'next/server';

/** Trang cần đăng nhập: chưa có cookie accessToken → /dang-nhap?redirect=<url hiện tại>. */
export function proxy(request: NextRequest) {
  if (request.cookies.has('accessToken')) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const loginUrl = new URL('/dang-nhap', request.url);
  loginUrl.searchParams.set('redirect', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/ca-nhan/:path*', '/yeu-thich/:path*', '/dang-tin/:path*', '/kenh-nguoi-dang/:path*'],
};
