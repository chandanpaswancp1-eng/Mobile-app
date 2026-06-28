import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export async function POST(request) {
  try {
    const { access_token } = await request.json();
    
    // Set date range for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // Format YYYY-MM-DD
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const response = await client.transactionsGet({
      access_token: access_token,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 50,
        offset: 0,
      },
    });

    const formattedTransactions = response.data.transactions.map(tx => ({
      id: tx.transaction_id,
      type: 'card',
      merchant: tx.merchant_name || tx.name || 'Unknown Merchant',
      amount: tx.amount,
      category: tx.category ? tx.category[0] : 'Uncategorized',
      date: new Date(tx.date).toLocaleDateString(),
    }));

    return NextResponse.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
