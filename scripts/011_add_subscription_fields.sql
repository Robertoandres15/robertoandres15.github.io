-- Add subscription-related fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create subscription_payments table to track payment history
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add RLS policies for subscription_payments
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment history" ON subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON subscription_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
