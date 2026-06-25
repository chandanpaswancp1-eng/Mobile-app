-- Schema for Eco-Friendly Expense Tracker

-- 1. Create transactions table
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    amount NUMERIC NOT NULL,
    currency VARCHAR(3) DEFAULT 'AED',
    date TIMESTAMPTZ DEFAULT NOW(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('cash', 'card')),
    merchant_name VARCHAR(255),
    category VARCHAR(100)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Users can insert their own transactions"
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);
