import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, wish } = await req.json()

    if (!name || !email || !wish) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from('manifest_wishes').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      wish: wish.trim(),
    })

    if (error) {
      console.error('[v0] manifest-wish insert error:', error)
      return NextResponse.json({ error: 'Failed to save your wish.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] manifest-wish unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
