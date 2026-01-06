import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    // 1. Create a Primary Agent
    const neo = await prisma.user.upsert({
        where: { email: 'neo@matrix.net' },
        update: {},
        create: {
            email: 'neo@matrix.net',
            name: 'NEO',
            password: hashedPassword,
            role: 'USER',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neo'
        },
    })

    // 2. Create Support Agent
    const trinity = await prisma.user.upsert({
        where: { email: 'trinity@matrix.net' },
        update: {},
        create: {
            email: 'trinity@matrix.net',
            name: 'TRINITY',
            password: hashedPassword,
            role: 'USER',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Trinity'
        },
    })

    // 3. Create Groups
    const coreNode = await prisma.group.upsert({
        where: { id: 'core-node' },
        update: {},
        create: {
            id: 'core-node',
            name: 'CORE_NETWORK',
            description: 'The primary intelligence channel for the resistance.',
            members: { connect: [{ id: neo.id }, { id: trinity.id }] }
        },
    })

    const sectorZero = await prisma.group.upsert({
        where: { id: 'sector-zero' },
        update: {},
        create: {
            id: 'sector-zero',
            name: 'SECTOR_ZERO',
            description: 'Unencrypted public broadcast frequency.',
            members: { connect: [{ id: neo.id }] }
        },
    })

    // 4. Create Sample Feed Content
    const post = await prisma.post.create({
        data: {
            content: "THE_MATRIX_HAS_YOU. Follow the white rabbit.",
            authorId: neo.id,
            groupId: coreNode.id,
        }
    })

    await prisma.comment.create({
        data: {
            content: "I'm in. Uplink established.",
            authorId: trinity.id,
            postId: post.id
        }
    })

    await prisma.like.create({
        data: {
            authorId: trinity.id,
            postId: post.id
        }
    })

    console.log("Seeding complete. Agents deployed to the Grid.")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
