// This file is responsible for assigning chores to household members in a round-robin fashion.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// helper to get ISO week number
function getWeekNumber(dt = new Date()) {
	// Copy date so don’t modify original
	const date = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
	// Set to nearest Thursday: current date + 4 - current day number
	const dayNum = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - dayNum);
	// Year of the Thursday
	const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
	// Calculate full weeks to nearest Thursday
	return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

export async function POST() {
	// 1) load all household members from DB
	const users = await prisma.user.findMany({ select: { name: true } });
	if (!users.length) {
		return NextResponse.json(
			{ message: 'No users found to assign chores' },
			{ status: 500 }
		);
	}
	const members = users.map(u => u.name);

	// 2) pull all chores in creation order
	const chores = await prisma.chore.findMany({
		orderBy: { createdAt: 'asc' },
	});
	if (!chores.length) {
		return NextResponse.json([], { status: 200 });
	}

	// 3) compute a week-based rotation offset
	const weekOffset = getWeekNumber() % members.length;

	// 4) reset done & assign each chore
	const updated = await Promise.all(
		chores.map((chore, idx) => {
			const assignee = members[(idx + weekOffset) % members.length];
			return prisma.chore.update({
				where: { id: chore.id },
				data: { assignedTo: assignee, done: false },
			});
		})
	);

	return NextResponse.json(updated);
}
