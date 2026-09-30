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
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const role = (body.role || '').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (email === user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot invite yourself to your family circle.' },
        { status: 400 }
      );
    }

    // Insert new invite
    // Note: We do not append .select() immediately to avoid evaluating SELECT RLS policies
    // if the Postgres database has not yet updated (select email from auth.users)
    const newMemberPayload = {
      owner_id: user.id,
      member_email: email,
      role: role || null,
      status: 'pending' as const,
      invited_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('family_members')
      .insert(newMemberPayload);

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'This email has already been invited to your family circle.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: insertError.message || 'Failed to send invite' },
        { status: 500 }
      );
    }

    // Try to fetch the created member or return synthesized object
    const { data: memberData } = await supabase
      .from('family_members')
      .select('*')
      .eq('owner_id', user.id)
      .eq('member_email', email)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      member: memberData || {
        id: crypto.randomUUID(),
        ...newMemberPayload,
      },
    });
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
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.json({ error: 'Missing invite ID' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('id', inviteId)
      .eq('owner_id', user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
