import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET - Get member's policies
export async function GET(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if user is owner or admin
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: user.id,
        },
      },
    });

    if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    // Get member with policies
    const member = await prisma.workspaceMember.findUnique({
      where: { id: params.memberId },
      include: {
        customPolicies: {
          where: {
            isActive: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!member) {
      return new NextResponse('Member not found', { status: 404 });
    }

    // Get workspace managed policies
    const workspacePolicies = await prisma.workspacePolicy.findMany({
      where: {
        workspaceId: params.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      member,
      attachedPolicies: member.attachedPolicies,
      customPolicies: member.customPolicies,
      availablePolicies: workspacePolicies,
    });
  } catch (error) {
    console.error('Error fetching member policies:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Attach policy to member
export async function POST(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if user is owner or admin
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: user.id,
        },
      },
    });

    if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const { policyId, customPolicy } = await req.json();

    if (policyId) {
      // Attach managed policy
      const member = await prisma.workspaceMember.findUnique({
        where: { id: params.memberId },
      });

      if (!member) {
        return new NextResponse('Member not found', { status: 404 });
      }

      const attachedPolicies = member.attachedPolicies || [];
      if (!attachedPolicies.includes(policyId)) {
        attachedPolicies.push(policyId);
      }

      const updatedMember = await prisma.workspaceMember.update({
        where: { id: params.memberId },
        data: {
          attachedPolicies,
        },
      });

      return NextResponse.json({ member: updatedMember });
    } else if (customPolicy) {
      // Create custom policy
      const policy = await prisma.memberCustomPolicy.create({
        data: {
          memberId: params.memberId,
          name: customPolicy.name,
          description: customPolicy.description,
          statements: customPolicy.statements,
          resourcePatterns: customPolicy.resourcePatterns || [],
          actions: customPolicy.actions || [],
          conditions: customPolicy.conditions || null,
        },
      });

      return NextResponse.json({ policy });
    }

    return new NextResponse('Either policyId or customPolicy required', { status: 400 });
  } catch (error) {
    console.error('Error attaching policy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Detach policy from member
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if user is owner or admin
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: user.id,
        },
      },
    });

    if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const policyId = searchParams.get('policyId');
    const customPolicyId = searchParams.get('customPolicyId');

    if (policyId) {
      // Detach managed policy
      const member = await prisma.workspaceMember.findUnique({
        where: { id: params.memberId },
      });

      if (!member) {
        return new NextResponse('Member not found', { status: 404 });
      }

      const attachedPolicies = (member.attachedPolicies || []).filter(
        (id) => id !== policyId
      );

      await prisma.workspaceMember.update({
        where: { id: params.memberId },
        data: {
          attachedPolicies,
        },
      });

      return NextResponse.json({ success: true });
    } else if (customPolicyId) {
      // Delete custom policy
      await prisma.memberCustomPolicy.delete({
        where: { id: customPolicyId },
      });

      return NextResponse.json({ success: true });
    }

    return new NextResponse('Either policyId or customPolicyId required', { status: 400 });
  } catch (error) {
    console.error('Error detaching policy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
