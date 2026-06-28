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

export async function POST() {
  try {
    const request = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: 'user_good',
      },
      client_name: 'Eco-Expense Tracker',
      products: ['transactions'],
      language: 'en',
      country_codes: ['US'],
    };
    const createTokenResponse = await client.linkTokenCreate(request);
    return NextResponse.json(createTokenResponse.data);
  } catch (error) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    );
  }
}
