import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface PayoutRequest {
  email: string;
  amount: number;
  coins: number;
  userId: string;
}

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalPayoutResponse {
  batch_header: {
    payout_batch_id: string;
    batch_status: string;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const { email, amount, coins, userId }: PayoutRequest = await req.json();

    // Validate input
    if (!email || !amount || !coins || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get PayPal credentials from environment
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'PayPal credentials not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Use sandbox for testing, live for production
    const baseUrl = 'https://api-m.sandbox.paypal.com'; // Change to https://api-m.paypal.com for live

    // Step 1: Get PayPal access token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('PayPal token error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to authenticate with PayPal' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const tokenData: PayPalTokenResponse = await tokenResponse.json();

    // Step 2: Create payout
    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `batch_${Date.now()}_${userId}`,
        email_subject: "You have a payout from Coin Tapper!",
        email_message: `Congratulations! You've successfully redeemed ${coins.toLocaleString()} coins for $${amount}.`
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: amount.toString(),
            currency: "USD"
          },
          receiver: email,
          note: `Coin Tapper payout: ${coins.toLocaleString()} coins redeemed`,
          sender_item_id: `item_${Date.now()}_${userId}`
        }
      ]
    };

    const payoutResponse = await fetch(`${baseUrl}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify(payoutData),
    });

    if (!payoutResponse.ok) {
      const errorText = await payoutResponse.text();
      console.error('PayPal payout error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to process payout' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const payoutResult: PayPalPayoutResponse = await payoutResponse.json();

    return new Response(JSON.stringify({
      success: true,
      batchId: payoutResult.batch_header.payout_batch_id,
      status: payoutResult.batch_header.batch_status,
      message: `$${amount} has been sent to ${email}. It may take a few minutes to appear in your PayPal account.`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Payout function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});