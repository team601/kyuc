import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, role, customName, customAvatarUrl } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });
    }

    // Verify ownership
    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('id, owner_id')
      .eq('id', memberId)
      .single();

    if (fetchError || !member || member.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to edit this family member' },
        { status: 403 }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (role !== undefined) updatePayload.role = role.trim() || null;
    if (customName !== undefined) updatePayload.custom_name = customName.trim() || null;
    if (customAvatarUrl !== undefined) updatePayload.custom_avatar_url = customAvatarUrl || null;

    const { data: updated, error: updateError } = await supabase
      .from('family_members')
      .update(updatePayload)
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });
    }

    // Check membership and authorization
    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('id, owner_id, member_id, member_email')
      .eq('id', memberId)
      .single();

    if (fetchError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const isHost = member.owner_id === user.id;
    const isSelf =
      member.member_id === user.id ||
      member.member_email.toLowerCase() === (user.email || '').toLowerCase();

    if (!isHost && !isSelf) {
      return NextResponse.json(
        { error: 'You are not authorized to remove this family member' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, removedId: memberId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

