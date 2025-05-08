// This file handles the API routes for the chores

// Imports
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
	const chores = await prisma.chore.findMany({ orderBy: { createdAt: 'asc' } });
	return NextResponse.json(chores);
}

export async function POST(request) {
	const { label } = await request.json();
	if (!label) return NextResponse.json({ message: 'label is required' }, { status: 400 });
	const newChore = await prisma.chore.create({ data: { label } });
	return NextResponse.json(newChore, { status: 201 });
}

export async function PATCH(request) {
	const { id, done } = await request.json();
	const updated = await prisma.chore.update({ where: { id }, data: { done } });
	return NextResponse.json(updated);
}

export async function DELETE(request) {
	const { id } = await request.json();
	await prisma.chore.delete({ where: { id } });
	return NextResponse.json({ id });
}