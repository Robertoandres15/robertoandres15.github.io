-- Create SMS invites table for tracking sent invitations
CREATE TABLE IF NOT EXISTS public.sms_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_invites_sender ON public.sms_invites(sender_id);
CREATE INDEX IF NOT EXISTS idx_sms_invites_phone ON public.sms_invites(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_invites_created_at ON public.sms_invites(created_at);

-- Enable RLS
ALTER TABLE public.sms_invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own SMS invites" ON public.sms_invites
    FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "Users can insert their own SMS invites" ON public.sms_invites
    FOR INSERT WITH CHECK (sender_id = auth.uid());
