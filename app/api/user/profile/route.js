// Imports
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PATCH(req) {
	// Authentication
	const session = await getServerSession(authOptions);
	if (!session) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Parse JSON body
	const { firstName, lastName, email, venmo, avatar, password, confirm } = await req.json();

	// Upload avatar externally if provided in base64
	let avatarUrl = avatar;
	if (avatar && avatar.startsWith('data:')) {
		try {
			const [, base64] = avatar.split(',');
			const mimeMatch = avatar.match(/data:(image\/\w+);/);
			const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
			const ext = mimeType.split('/')[1] || 'png';
			const filename = `${session.user.username}-${Date.now()}.${ext}`;
			const buffer = Buffer.from(base64, 'base64');

			// Prepare form data
			const formData = new FormData();
			formData.append('file', new Blob([buffer], { type: mimeType }), filename);

			// Upload to external service
			const uploadRes = await fetch('https://img.mathew.ws/upload', {
				method: 'POST',
				body: formData,
			});

			if (!uploadRes.ok) {
				throw new Error('Avatar upload failed');
			}

			const uploadData = await uploadRes.json();
			avatarUrl = uploadData.url + "/inline";
		} catch (err) {
			console.error('Upload error:', err);
			return NextResponse.json({ error: 'Avatar upload failed' }, { status: 500 });
		}
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
