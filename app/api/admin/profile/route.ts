import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, hashPassword, verifyPassword, createAdminToken } from '@/lib/auth';

export async function GET() {
  try {
    const token = cookies().get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const session = verifyAdminToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: admin });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'تعذر تحميل بيانات المسؤول' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const token = cookies().get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const session = verifyAdminToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const updateData: { name?: string; email?: string; password?: string } = {};

    // 1. Update Name
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    // 2. Update Email
    if (email && email.trim() && email.trim().toLowerCase() !== admin.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = await prisma.adminUser.findUnique({
        where: { email: cleanEmail },
      });
      if (existing && existing.id !== admin.id) {
        return NextResponse.json(
          { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل لمسؤول آخر' },
          { status: 400 }
        );
      }
      updateData.email = cleanEmail;
    }

    // 3. Update Password
    if (newPassword && newPassword.trim()) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'يرجى إدخال كلمة المرور الحالية لتأكيد التغيير' },
          { status: 400 }
        );
      }

      const isCurrentCorrect = await verifyPassword(currentPassword, admin.password);
      if (!isCurrentCorrect) {
        return NextResponse.json(
          { success: false, error: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        );
      }

      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 خانات' },
          { status: 400 }
        );
      }

      updateData.password = await hashPassword(newPassword.trim());
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'لم يتم تقديم أي تغييرات' }, { status: 400 });
    }

    const updatedAdmin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // If email or name changed, issue fresh token cookie
    const newToken = createAdminToken({
      id: updatedAdmin.id,
      email: updatedAdmin.email,
      name: updatedAdmin.name,
      role: updatedAdmin.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات المسؤول بنجاح',
      user: updatedAdmin,
    });

    response.cookies.set('admin_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'تعذر تحديث بيانات المسؤول' },
      { status: 500 }
    );
  }
}
