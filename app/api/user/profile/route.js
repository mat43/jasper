// Imports
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function PATCH(req) {
	// Authentication
	const session = await getServerSession(authOptions);
	if (!session) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Parse JSON body
	const { firstName, lastName, email, venmo, avatar, password, confirm } = await req.json();

	// Handle Base64 avatar if present
	let avatarUrl = avatar;
	if (avatar && avatar.startsWith('data:')) {
		const [, base64] = avatar.split(',');
		const buffer = Buffer.from(base64, 'base64');
		const extMatch = avatar.match(/data:image\/(\w+);/);
		const ext = extMatch ? extMatch[1] : 'png';
		const filename = `${session.user.username}-${Date.now()}.${ext}`;
		const uploadDir = path.join(process.cwd(), 'public/uploads');
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		const uploadPath = path.join(uploadDir, filename);
		fs.writeFileSync(uploadPath, buffer);
		avatarUrl = `/uploads/${filename}`;
	}

	// Build update data
	const updateData = {
		avatarUrl,
		name: `${firstName || ''} ${lastName || ''}`.trim(),
		email,
		venmoUsername: venmo,
	};
	// Conditionally include password
	if (password && password === confirm) {
		const bcrypt = await import('bcryptjs');
		updateData.password = await bcrypt.hash(password, 10);
	}

	// Update user in DB using username
	const updatedUser = await prisma.user.update({
		where: { username: session.user.username },
		data: updateData,
	});

	// Return 200 and updated user
	return NextResponse.json({ ok: true, user: updatedUser });
}
