import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import School from "@/models/School";
import { comparePassword, signJWT, AUTH_COOKIE } from "@/lib/auth";
import { UserRole } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user by email and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated" },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.password!);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Retrieve school information if applicable
    let schoolSlug: string | null = null;
    let schoolName: string | null = null;

    if (user.schoolId) {
      const school = await School.findById(user.schoolId).select("name slug status");
      if (school) {
        if (school.status === "SUSPENDED") {
          return NextResponse.json(
            { error: "This institution's account is currently suspended" },
            { status: 403 }
          );
        }
        schoolSlug = school.slug;
        schoolName = school.name;
      }
    }

    // Sign JWT
    const token = await signJWT({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      schoolId: user.schoolId ? user.schoolId.toString() : null,
      schoolSlug,
      schoolName,
    });

    const roleHomeMap: Record<UserRole, string> = {
      SUPER_ADMIN: "/admin/saas",
      INSTITUTION_ADMIN: "/admin/school",
      TEACHER: "/teacher",
      PARENT: "/parent",
      STUDENT: "/student",
    };

    const redirectUrl = roleHomeMap[user.role as UserRole] || "/";

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        schoolName,
        schoolSlug,
      },
      redirectUrl,
    });

    // Set HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
