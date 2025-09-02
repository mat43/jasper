// This file handles the API routes for the groceries list.

// Imports
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
	const list = await prisma.list.findMany({ orderBy: { createdAt: 'asc' } });
	return NextResponse.json(list);
}

export async function POST(request) {
	const { label } = await request.json();
	if (!label) return NextResponse.json({ message: 'label is required' }, { status: 400 });
	const newItem = await prisma.list.create({ data: { label } });
	return NextResponse.json(newItem, { status: 201 });
}

export async function PATCH(request) {
	const { id, done } = await request.json();
	const updated = await prisma.list.update({ where: { id }, data: { done } });
	return NextResponse.json(updated);
}

export async function DELETE(request) {
	const { id } = await request.json();
	await prisma.list.delete({ where: { id } });
	return NextResponse.json({ id });
}