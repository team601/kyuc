import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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
    const inviteId = body.inviteId;
    const accept = Boolean(body.accept);

    if (!inviteId) {
      return NextResponse.json({ error: 'Missing inviteId' }, { status: 400 });
    }

    // Verify and update invitation
    const userEmail = user.email?.toLowerCase();

    const { data: invite, error: fetchError } = await supabase
      .from('family_members')
      .select('id, owner_id, member_email, member_id, status')
      .eq('id', inviteId)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invite.member_email.toLowerCase() !== userEmail && invite.member_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to respond to this invitation' },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from('family_members')
      .update({
        status: accept ? 'accepted' : 'declined',
        member_id: accept ? user.id : invite.member_id,
      })
      .eq('id', inviteId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: accept ? 'accepted' : 'declined',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
