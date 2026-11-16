import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getCoursesPage } from "@/lib/courses";

export const dynamic = "force-dynamic";

// GET /api/generate-courses-list?page=1&limit=50&promotion=&search=&sort=&order=
export async function GET(req) {
  const token = await getToken({ req });
  if (!token && process.env.SKIP_KEYCLOAK !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  try {
    const result = await getCoursesPage({
      page: params.get("page"),
      limit: params.get("limit"),
      promotion: params.get("promotion"),
      search: params.get("search"),
      sort: params.get("sort"),
      order: params.get("order"),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
